from rest_framework import serializers

from apps.students.serializers import SpecializationSerializer
from apps.teachers.serializers import TeacherListSerializer

from .models import (
    Course,
    CourseCoTeacher,
    CoursePrerequisite,
    CourseSyllabusVersion,
)


class CourseCoTeacherSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)

    class Meta:
        model = CourseCoTeacher
        fields = ["id", "teacher", "teacher_name", "added_at"]
        read_only_fields = ["id", "added_at"]


class CoursePrerequisiteSerializer(serializers.ModelSerializer):
    required_course_code = serializers.CharField(
        source="required_course.code", read_only=True
    )

    class Meta:
        model = CoursePrerequisite
        fields = ["id", "required_course", "required_course_code"]
        read_only_fields = ["id"]


class CourseSyllabusVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseSyllabusVersion
        fields = [
            "id",
            "version_number",
            "media_file_id",
            "notes",
            "published_at",
        ]
        read_only_fields = ["id", "published_at"]


class CourseListSerializer(serializers.ModelSerializer):
    """Vue allégée — catalogue public / listing rapide."""

    specialization_name = serializers.CharField(
        source="specialization.name", read_only=True
    )
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    seats_available = serializers.IntegerField(read_only=True)
    seats_taken = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "name",
            "specialization_name",
            "teacher_name",
            "duration_weeks",
            "fees_amount",
            "status",
            "seats_taken",
            "seats_available",
        ]


class CourseDetailSerializer(serializers.ModelSerializer):
    """Vue complète — fiche cours (admin / dashboard prof)."""

    specialization_detail = SpecializationSerializer(
        source="specialization", read_only=True
    )
    teacher_detail = TeacherListSerializer(source="teacher", read_only=True)
    co_teachers = CourseCoTeacherSerializer(many=True, read_only=True)
    prerequisites = CoursePrerequisiteSerializer(many=True, read_only=True)
    syllabus_versions = CourseSyllabusVersionSerializer(many=True, read_only=True)
    seats_taken = serializers.IntegerField(read_only=True)
    seats_available = serializers.IntegerField(read_only=True)

    class Meta:
        model = Course
        fields = [
            "id",
            "code",
            "name",
            "description",
            "specialization",
            "specialization_detail",
            "teacher",
            "teacher_detail",
            "duration_weeks",
            "capacity_max",
            "seats_taken",
            "seats_available",
            "fees_amount",
            "status",
            "start_date",
            "end_date",
            "synced",
            "created_at",
            "updated_at",
            "co_teachers",
            "prerequisites",
            "syllabus_versions",
        ]
        read_only_fields = ["id", "synced", "created_at", "updated_at"]

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and end < start:
            raise serializers.ValidationError(
                {"end_date": "La date de fin doit être postérieure à la date de début."}
            )
        return attrs
