from rest_framework import serializers

from apps.teachers.serializers import TeacherListSerializer

from apps.projects.models import (
    BusinessPlan,
    BusinessPlanPresentation,
    Company,
    Internship,
    InternshipLog,
    Mentorship,
    MentorshipSession,
    IncubatorMentor,
    Project,
    ProjectDeliverable,
    ProjectMember,
)

# --- Projets ----------------------------------------------------------------


class ProjectMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMember
        fields = ["id", "student_id", "role", "contribution", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class ProjectDeliverableSerializer(serializers.ModelSerializer):
    is_late = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProjectDeliverable
        fields = [
            "id",
            "name",
            "due_date",
            "status",
            "file_path",
            "submitted_at",
            "submitted_by_student_id",
            "grade",
            "feedback",
            "synced",
            "is_late",
        ]
        read_only_fields = ["id", "submitted_at"]


class ProjectListSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source="course.code", read_only=True)
    members_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "course",
            "course_code",
            "teacher",
            "status",
            "final_grade",
            "members_count",
            "description",
            "incubator_data",
        ]


class ProjectDetailSerializer(serializers.ModelSerializer):
    teacher_detail = TeacherListSerializer(source="teacher", read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)
    deliverables = ProjectDeliverableSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "description",
            "course",
            "teacher",
            "teacher_detail",
            "status",
            "final_grade",
            "created_at",
            "updated_at",
            "incubator_data",
            "members",
            "deliverables",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# --- Stages -------------------------------------------------------------


class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "sector",
            "address",
            "contact_name",
            "contact_email",
            "contact_phone",
        ]
        read_only_fields = ["id"]


class InternshipLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipLog
        fields = [
            "id",
            "log_date",
            "daily_activities",
            "challenges",
            "synced",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InternshipListSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source="company.name", read_only=True)
    company_sector = serializers.CharField(source="company.sector", read_only=True)

    class Meta:
        model = Internship
        fields = [
            "id",
            "student_id",
            "student_name",
            "promotion",
            "company",
            "company_name",
            "company_sector",
            "position",
            "supervisor_name",
            "assessment",
            "start_date",
            "end_date",
            "status",
            "final_grade",
        ]


class InternshipDetailSerializer(serializers.ModelSerializer):
    company_detail = CompanySerializer(source="company", read_only=True)
    mentor_detail = TeacherListSerializer(source="mentor", read_only=True)
    logs = InternshipLogSerializer(many=True, read_only=True)

    class Meta:
        model = Internship
        fields = [
            "id",
            "student_id",
            "student_name",
            "promotion",
            "company",
            "company_detail",
            "mentor",
            "mentor_detail",
            "position",
            "supervisor_name",
            "assessment",
            "start_date",
            "end_date",
            "status",
            "final_grade",
            "certificate_path",
            "created_at",
            "updated_at",
            "logs",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_date": "La date de fin doit être après la date de début."}
            )
        return attrs


# --- Mentorat -------------------------------------------------------------


class MentorshipSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorshipSession
        fields = [
            "id",
            "session_date",
            "duration_minutes",
            "notes",
            "feedback",
            "synced",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MentorshipSerializer(serializers.ModelSerializer):
    teacher_detail = TeacherListSerializer(source="teacher", read_only=True)
    sessions = MentorshipSessionSerializer(many=True, read_only=True)

    class Meta:
        model = Mentorship
        fields = [
            "id",
            "student_id",
            "teacher",
            "teacher_detail",
            "start_date",
            "status",
            "objectives",
            "created_at",
            "sessions",
        ]
        read_only_fields = ["id", "created_at"]


class IncubatorMentorSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncubatorMentor
        fields = ["id", "full_name", "profession", "company", "phone", "email", "specialty", "availability", "created_at"]
        read_only_fields = ["id", "created_at"]


# --- Business Plan ----------------------------------------------------------


class BusinessPlanPresentationSerializer(serializers.ModelSerializer):
    evaluator_name = serializers.CharField(source="evaluator.full_name", read_only=True)

    class Meta:
        model = BusinessPlanPresentation
        fields = [
            "id",
            "presentation_date",
            "score",
            "evaluator",
            "evaluator_name",
            "evaluator_comments",
        ]
        read_only_fields = ["id"]


class BusinessPlanSerializer(serializers.ModelSerializer):
    presentations = BusinessPlanPresentationSerializer(many=True, read_only=True)

    class Meta:
        model = BusinessPlan
        fields = [
            "id",
            "student_id",
            "business_name",
            "description",
            "financial_projection",
            "status",
            "final_grade",
            "bearer_name",
            "submitted_date",
            "created_at",
            "updated_at",
            "presentations",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
