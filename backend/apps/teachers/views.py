from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Avg, Count
from django.utils import timezone
from datetime import timedelta

from .models import (
    Teacher, TeacherQualification, TeacherSpecialty, TeacherSchedule,
    TeacherAttendance, TeacherPerformanceReview, TeacherLeaveRequest,
    TeacherCertification
)
from .serializers import (
    TeacherListSerializer, TeacherDetailSerializer, TeacherCreateUpdateSerializer,
    TeacherQualificationSerializer, TeacherSpecialtySerializer, TeacherScheduleSerializer,
    TeacherAttendanceSerializer, TeacherPerformanceReviewSerializer, TeacherLeaveRequestSerializer,
    TeacherCertificationSerializer, TeacherStatusChangeSerializer,
    TeacherRatingUpdateSerializer, TeacherAttendanceReportSerializer,
    TeacherPerformanceReviewCreateSerializer, TeacherLeaveRequestCreateSerializer,
    TeacherLeaveRequestApprovalSerializer
)
from apps.users.permissions import IsAdminUser, IsTeacher


class TeacherViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des professeurs

    Endpoints:
    - GET /api/v1/teachers/ - Liste des professeurs
    - POST /api/v1/teachers/ - Créer un professeur
    - GET /api/v1/teachers/{id}/ - Détails d'un professeur
    - PUT/PATCH /api/v1/teachers/{id}/ - Modifier un professeur
    - DELETE /api/v1/teachers/{id}/ - Supprimer un professeur
    - GET /api/v1/teachers/{id}/qualifications/ - Qualifications
    - POST /api/v1/teachers/{id}/add-qualification/ - Ajouter qualification
    - GET /api/v1/teachers/{id}/specialties/ - Spécialités
    - POST /api/v1/teachers/{id}/add-specialty/ - Ajouter spécialité
    - GET /api/v1/teachers/{id}/schedule/ - Horaire
    - GET /api/v1/teachers/{id}/attendance/ - Présences
    - POST /api/v1/teachers/{id}/mark-attendance/ - Marquer présence
    - GET /api/v1/teachers/{id}/performance-reviews/ - Évaluations
    - POST /api/v1/teachers/{id}/add-performance-review/ - Ajouter évaluation
    - GET /api/v1/teachers/{id}/leave-requests/ - Demandes de congé
    - POST /api/v1/teachers/{id}/request-leave/ - Demander un congé
    - POST /api/v1/teachers/{id}/leave-requests/{leave_id}/approve/ - Approver congé
    - GET /api/v1/teachers/{id}/attendance-report/ - Rapport présences
    - GET /api/v1/teachers/by-subject/?subject=... - Professeurs par matière
    - GET /api/v1/teachers/by-subject/{subject}/ - Professeurs par matière
    - POST /api/v1/teachers/{id}/update-rating/ - Ajouter une note
    """

    queryset = Teacher.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create' or self.action in ['update', 'partial_update']:
            return TeacherCreateUpdateSerializer
        elif self.action == 'retrieve':
            return TeacherDetailSerializer
        elif self.action == 'add_qualification':
            return TeacherQualificationSerializer
        elif self.action == 'add_specialty':
            return TeacherSpecialtySerializer
        elif self.action == 'add_performance_review':
            return TeacherPerformanceReviewCreateSerializer
        elif self.action == 'request_leave':
            return TeacherLeaveRequestCreateSerializer
        elif self.action == 'mark_attendance':
            return TeacherAttendanceSerializer
        elif self.action == 'update_rating':
            return TeacherRatingUpdateSerializer
        elif self.action == 'change_status':
            return TeacherStatusChangeSerializer
        return TeacherListSerializer

    def get_queryset(self):
        """Filtrer les professeurs selon les paramètres"""
        queryset = Teacher.objects.prefetch_related(
            'qualifications', 'specialties', 'schedules', 'certifications', 'courses_taught'
        )

        # Filtrer par statut
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)

        # Filtrer par type d'emploi
        employment_type = self.request.query_params.get('employment_type')
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)

        # Filtrer par spécialité
        subject = self.request.query_params.get('subject')
        if subject:
            queryset = queryset.filter(specialties__subject=subject)

        # Recherche par nom ou email
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(user__email__icontains=search) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(teacher_id__icontains=search)
            )

        # Filtrer par evaluation minimale
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(rating__gte=float(min_rating))

        return queryset.distinct()

    @action(detail=True, methods=['get'])
    def qualifications(self, request, pk=None):
        """Obtenir les qualifications d'un professeur"""
        teacher = self.get_object()
        serializer = TeacherQualificationSerializer(
            teacher.qualifications.all(),
            many=True
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='add-qualification')
    def add_qualification(self, request, pk=None):
        """Ajouter une qualification"""
        teacher = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qualification = TeacherQualification.objects.create(
            teacher=teacher,
            **serializer.validated_data
        )

        return Response(
            TeacherQualificationSerializer(qualification).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def specialties(self, request, pk=None):
        """Obtenir les spécialités d'un professeur"""
        teacher = self.get_object()
        serializer = TeacherSpecialtySerializer(
            teacher.specialties.all(),
            many=True
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='add-specialty')
    def add_specialty(self, request, pk=None):
        """Ajouter une spécialité"""
        teacher = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        specialty = TeacherSpecialty.objects.create(
            teacher=teacher,
            **serializer.validated_data
        )

        return Response(
            TeacherSpecialtySerializer(specialty).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Obtenir l'horaire d'un professeur"""
        teacher = self.get_object()
        serializer = TeacherScheduleSerializer(
            teacher.schedules.filter(is_active=True),
            many=True
        )
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        """Obtenir les présences d'un professeur"""
        teacher = self.get_object()
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)

        attendances = teacher.attendances.filter(date__gte=start_date)
        serializer = TeacherAttendanceSerializer(attendances, many=True)

        total_days = attendances.count()
        present_days = attendances.filter(is_present=True).count()
        absent_days = attendances.filter(is_present=False).count()

        return Response({
            'period_days': days,
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'statistics': {
                'total_days': total_days,
                'present_days': present_days,
                'absent_days': absent_days,
                'attendance_rate': round((present_days / total_days) * 100, 2) if total_days > 0 else 0,
            },
            'attendances': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='mark-attendance')
    def mark_attendance(self, request, pk=None):
        """Marquer la présence d'un professeur"""
        teacher = self.get_object()
        date = request.data.get('date')
        is_present = request.data.get('is_present', True)

        attendance, created = TeacherAttendance.objects.update_or_create(
            teacher=teacher,
            date=date,
            defaults={
                'is_present': is_present,
                'check_in_time': request.data.get('check_in_time'),
                'check_out_time': request.data.get('check_out_time'),
                'absence_type': request.data.get('absence_type') or '',
                'reason': request.data.get('reason', ''),
            }
        )

        return Response(
            TeacherAttendanceSerializer(attendance).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], url_path='performance-reviews')
    def performance_reviews(self, request, pk=None):
        """Obtenir les évaluations de performance"""
        teacher = self.get_object()
        serializer = TeacherPerformanceReviewSerializer(
            teacher.performance_reviews.all(),
            many=True
        )

        avg_rating = teacher.performance_reviews.aggregate(Avg('overall_rating'))

        return Response({
            'average_rating': avg_rating['overall_rating__avg'],
            'total_reviews': teacher.performance_reviews.count(),
            'reviews': serializer.data
        })

    @action(detail=True, methods=['post'], url_path='add-performance-review')
    def add_performance_review(self, request, pk=None):
        """Ajouter une évaluation de performance"""
        teacher = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        review = TeacherPerformanceReview.objects.create(
            teacher=teacher,
            reviewer=request.user,
            **serializer.validated_data
        )

        return Response(
            TeacherPerformanceReviewSerializer(review).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'], url_path='leave-requests')
    def leave_requests(self, request, pk=None):
        """Obtenir les demandes de congé"""
        teacher = self.get_object()
        status_param = request.query_params.get('status')

        leaves = teacher.leave_requests.all()
        if status_param:
            leaves = leaves.filter(status=status_param)

        serializer = TeacherLeaveRequestSerializer(leaves, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='request-leave')
    def request_leave(self, request, pk=None):
        """Demander un congé"""
        teacher = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        leave = TeacherLeaveRequest.objects.create(
            teacher=teacher,
            **serializer.validated_data
        )

        return Response(
            TeacherLeaveRequestSerializer(leave).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], url_path=r'leave-requests/(?P<leave_id>\d+)/approve')
    def approve_leave(self, request, pk=None, leave_id=None):
        """Approver ou rejeter une demande de congé"""
        teacher = self.get_object()

        try:
            leave = TeacherLeaveRequest.objects.get(id=leave_id, teacher=teacher)
        except TeacherLeaveRequest.DoesNotExist:
            return Response(
                {'error': 'Demande de congé non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = TeacherLeaveRequestApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        leave.status = new_status
        leave.approved_by = request.user
        leave.approval_date = timezone.now()

        if new_status == 'REJECTED':
            leave.rejection_reason = serializer.validated_data.get('rejection_reason', '')

        leave.save()

        return Response(
            TeacherLeaveRequestSerializer(leave).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'], url_path='attendance-report')
    def attendance_report(self, request, pk=None):
        """Obtenir un rapport de présence"""
        teacher = self.get_object()
        serializer = TeacherAttendanceReportSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']

        attendances = teacher.attendances.filter(
            date__range=[start_date, end_date]
        )

        total_days = (end_date - start_date).days + 1
        present_days = attendances.filter(is_present=True).count()
        absent_days = attendances.filter(is_present=False).count()

        return Response({
            'teacher': TeacherListSerializer(teacher).data,
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'total_days': total_days
            },
            'statistics': {
                'present_days': present_days,
                'absent_days': absent_days,
                'attendance_rate': round((present_days / total_days) * 100, 2) if total_days > 0 else 0
            },
            'absences': TeacherAttendanceSerializer(
                attendances.filter(is_present=False),
                many=True
            ).data
        })

    @action(detail=False, methods=['get'], url_path='by-subject')
    def by_subject(self, request):
        """Obtenir les professeurs par matière"""
        subject = request.query_params.get('subject')
        return self._get_teachers_by_subject_response(subject)

    @action(
        detail=False,
        methods=['get'],
        url_path=r'by-subject/(?P<subject>[^/.]+)'
    )
    def by_subject_path(self, request, subject=None):
        """Obtenir les professeurs par matière via un segment d'URL"""
        return self._get_teachers_by_subject_response(subject)

    def _get_teachers_by_subject_response(self, subject):
        if not subject:
            return Response(
                {'error': 'Paramètre subject requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        teachers = Teacher.objects.filter(
            specialties__subject=subject,
            status='ACTIVE'
        ).distinct()

        serializer = TeacherListSerializer(teachers, many=True)
        return Response({
            'subject': subject,
            'count': teachers.count(),
            'teachers': serializer.data
        })
    

    @action(detail=True, methods=['post'], url_path='update-rating')
    def update_rating(self, request, pk=None):
        """Ajouter une note/évaluation"""
        teacher = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rating = serializer.validated_data['rating_value']
        teacher.update_rating(rating)

        return Response({
            'message': 'Note ajoutée',
            'new_average_rating': float(teacher.rating),
            'total_ratings': teacher.rating_count
        })

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Changer le statut d'un professeur"""
        teacher = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        teacher.status = serializer.validated_data['status']
        teacher.save()

        return Response(
            TeacherDetailSerializer(teacher).data,
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'])
    def certifications(self, request, pk=None):
        """Obtenir les certifications"""
        teacher = self.get_object()
        serializer = TeacherCertificationSerializer(
            teacher.certifications.all(),
            many=True
        )

        expired = teacher.certifications.filter(expiration_date__lt=timezone.now().date()).count()

        return Response({
            'total_certifications': teacher.certifications.count(),
            'expired_certifications': expired,
            'certifications': serializer.data
        })