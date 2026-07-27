from rest_framework import serializers
from apps.users.serializers import UserDetailSerializer
from .models import (
    Teacher, TeacherQualification, TeacherSpecialty, TeacherSchedule,
    TeacherAttendance, TeacherPerformanceReview, TeacherLeaveRequest,
    TeacherCertification
)


class TeacherQualificationSerializer(serializers.ModelSerializer):
    """Serializer pour les qualifications"""
    qualification_type_display = serializers.CharField(source='get_qualification_type_display', read_only=True)
    
    class Meta:
        model = TeacherQualification
        fields = [
            'id', 'qualification_type', 'qualification_type_display', 'field_of_study',
            'institution', 'graduation_year', 'certification_number', 'expiration_date', 'is_expired'
        ]
        read_only_fields = ['id', 'is_expired']


class TeacherSpecialtySerializer(serializers.ModelSerializer):
    """Serializer pour les spécialités"""
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    certification_level_display = serializers.CharField(source='get_certification_level_display', read_only=True)
    
    class Meta:
        model = TeacherSpecialty
        fields = [
            'id', 'subject', 'level', 'level_display', 'certification_level',
            'certification_level_display', 'years_of_experience', 'is_primary'
        ]
        read_only_fields = ['id']


class TeacherScheduleSerializer(serializers.ModelSerializer):
    """Serializer pour l'horaire"""
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    activity_display = serializers.CharField(source='get_activity_display', read_only=True)
    
    class Meta:
        model = TeacherSchedule
        fields = [
            'id', 'day_of_week', 'day_of_week_display', 'start_time', 'end_time',
            'location', 'activity', 'activity_display', 'is_active'
        ]
        read_only_fields = ['id']


class TeacherAttendanceSerializer(serializers.ModelSerializer):
    """Serializer pour la présence"""
    absence_type_display = serializers.CharField(source='get_absence_type_display', read_only=True)
    
    class Meta:
        model = TeacherAttendance
        fields = [
            'id', 'date', 'is_present', 'check_in_time', 'check_out_time',
            'absence_type', 'absence_type_display', 'reason', 'document_proof'
        ]
        read_only_fields = ['id']


class TeacherPerformanceReviewSerializer(serializers.ModelSerializer):
    """Serializer pour les évaluations de performance"""
    reviewer = UserDetailSerializer(read_only=True)
    review_period_display = serializers.CharField(source='get_review_period_display', read_only=True)
    
    class Meta:
        model = TeacherPerformanceReview
        fields = [
            'id', 'reviewer', 'review_period', 'review_period_display', 'review_date',
            'teaching_quality', 'student_engagement', 'professionalism', 'communication',
            'class_management', 'overall_rating', 'comments', 'improvement_areas', 'strengths'
        ]
        read_only_fields = ['id', 'overall_rating']


class TeacherLeaveRequestSerializer(serializers.ModelSerializer):
    """Serializer pour les demandes de congé"""
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    approved_by = UserDetailSerializer(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = TeacherLeaveRequest
        fields = [
            'id', 'leave_type', 'leave_type_display', 'start_date', 'end_date',
            'duration_days', 'reason', 'status', 'status_display', 'approved_by',
            'approval_date', 'rejection_reason'
        ]
        read_only_fields = ['id', 'approved_by', 'approval_date', 'duration_days']


class TeacherCertificationSerializer(serializers.ModelSerializer):
    """Serializer pour les certifications"""
    
    class Meta:
        model = TeacherCertification
        fields = [
            'id', 'name', 'issuing_body', 'issue_date', 'expiration_date',
            'credential_id', 'credential_url', 'is_expired'
        ]
        read_only_fields = ['id', 'is_expired']


class TeacherListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour les listes"""
    user = UserDetailSerializer(read_only=True)
    full_name = serializers.CharField( read_only=True)
    email = serializers.CharField( read_only=True)
    primary_specialty = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'user', 'full_name', 'email', 'teacher_id', 'employment_type',
            'status', 'status_display', 'primary_specialty', 'rating', 'hire_date'
        ]
        read_only_fields = [
            'id', 'user', 'full_name', 'email', 'rating', 'hire_date'
        ]
    
    def get_primary_specialty(self, obj):
        specialty = obj.get_primary_specialty()
        if specialty:
            return TeacherSpecialtySerializer(specialty).data
        return None


class TeacherDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour les professeurs"""
    user = UserDetailSerializer(read_only=True)
    full_name = serializers.CharField( read_only=True)
    email = serializers.CharField( read_only=True)
    qualifications = TeacherQualificationSerializer(many=True, read_only=True)
    specialties = TeacherSpecialtySerializer(many=True, read_only=True)
    schedules = TeacherScheduleSerializer(many=True, read_only=True)
    certifications = TeacherCertificationSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    employment_type_display = serializers.CharField(source='get_employment_type_display', read_only=True)
    
    class Meta:
        model = Teacher
        fields = [
            'id', 'user', 'full_name', 'email', 'teacher_id', 'employment_type',
            'employment_type_display', 'hire_date', 'status', 'status_display',
            'salary_grade', 'monthly_salary', 'health_insurance_number',
            'emergency_contact_name', 'emergency_contact_phone', 'office_location',
            'office_phone', 'bio', 'rating', 'rating_count',
            'qualifications', 'specialties', 'schedules', 'certifications',
            'is_synced', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'full_name', 'email', 'rating', 'rating_count',
            'created_at', 'updated_at', 'is_synced'
        ]


class TeacherCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer pour créer/mettre à jour un professeur"""
    
    class Meta:
        model = Teacher
        fields = [
            'teacher_id', 'employment_type', 'status', 'salary_grade',
            'monthly_salary', 'health_insurance_number', 'emergency_contact_name',
            'emergency_contact_phone', 'office_location', 'office_phone', 'bio'
        ]
    
    def validate_teacher_id(self, value):
        """Vérifier l'unicité du teacher_id"""
        if self.instance is None:
            if Teacher.objects.filter(teacher_id=value).exists():
                raise serializers.ValidationError('Cet ID professeur est déjà utilisé')
        else:
            if Teacher.objects.filter(teacher_id=value).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError('Cet ID professeur est déjà utilisé')
        return value


class TeacherStatusChangeSerializer(serializers.Serializer):
    """Serializer pour changer le statut"""
    status = serializers.ChoiceField(choices=Teacher.STATUS_CHOICES)
    reason = serializers.CharField(required=False, allow_blank=True)


class TeacherRatingUpdateSerializer(serializers.Serializer):
    """Serializer pour ajouter une note"""
    rating_value = serializers.DecimalField(max_digits=3, decimal_places=1, min_value=0, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)


class TeacherAttendanceReportSerializer(serializers.Serializer):
    """Serializer pour rapport de présence"""
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError('La date de fin doit être après la date de début')
        return data


class TeacherPerformanceReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer une évaluation"""
    
    class Meta:
        model = TeacherPerformanceReview
        fields = [
            'review_period', 'teaching_quality', 'student_engagement',
            'professionalism', 'communication', 'class_management',
            'comments', 'improvement_areas', 'strengths'
        ]


class TeacherLeaveRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer une demande de congé"""
    
    class Meta:
        model = TeacherLeaveRequest
        fields = ['leave_type', 'start_date', 'end_date', 'reason']
    
    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError(
                'La date de fin doit être après la date de début'
            )
        return data


class TeacherLeaveRequestApprovalSerializer(serializers.Serializer):
    """Serializer pour approver/rejeter un congé"""
    status = serializers.ChoiceField(choices=[('APPROVED', 'Approuvé'), ('REJECTED', 'Rejeté')])
    rejection_reason = serializers.CharField(required=False, allow_blank=True)


class BulkTeacherImportSerializer(serializers.Serializer):
    """Serializer pour importer des professeurs en bulk"""
    teachers = serializers.ListField(
        child=serializers.DictField(),
        help_text='Liste de professeurs à importer'
    )
    
    def validate_teachers(self, value):
        """Valider la liste des professeurs"""
        required_fields = ['email', 'first_name', 'last_name', 'teacher_id']
        
        for idx, teacher_data in enumerate(value):
            for field in required_fields:
                if field not in teacher_data:
                    raise serializers.ValidationError(
                        f'Champ manquant à la ligne {idx + 1}: {field}'
                    )
        
        return value