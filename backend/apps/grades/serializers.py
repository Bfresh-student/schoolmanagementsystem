from rest_framework import serializers

from .models import Grade, GradeConflict, GradeSyncEntry


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.get_full_name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = Grade
        fields = [
            "id", "student", "course", "teacher",
            "student_name", "course_name",
            "value", "date_graded", "synced", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "synced", "created_at", "updated_at"]


class GradeSubmitSerializer(serializers.Serializer):
    """
    Entrée pour la saisie d'une note, online ou offline. Ne touche jamais
    `Grade` directement : passe par `services.submit_grade`, seul point
    d'entrée autorisé, afin que la détection de conflit soit toujours
    appliquée.
    """
    student = serializers.PrimaryKeyRelatedField(queryset=Grade._meta.get_field("student").related_model.objects.all())
    course = serializers.PrimaryKeyRelatedField(queryset=Grade._meta.get_field("course").related_model.objects.all())
    value = serializers.DecimalField(max_digits=4, decimal_places=2, min_value=0, max_value=20)
    local_timestamp = serializers.DateTimeField()
    local_uuid = serializers.UUIDField(required=False)


class GradeSyncEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeSyncEntry
        fields = [
            "id", "local_uuid", "student", "course", "teacher",
            "value", "source", "submitted_by", "local_timestamp",
            "status", "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]


class GradeConflictSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="grade.student.user.get_full_name", read_only=True)
    course_name = serializers.CharField(source="grade.course.name", read_only=True)

    class Meta:
        model = GradeConflict
        fields = [
            "id", "sync_entry", "grade", "student_name", "course_name",
            "local_version", "remote_version",
            "resolution_choice", "resolved_value", "resolved_by", "resolved_at",
            "created_at",
        ]
        read_only_fields = [f for f in fields if f not in ()]  # tout est en lecture seule ici


class GradeConflictResolveSerializer(serializers.Serializer):
    choice = serializers.ChoiceField(choices=GradeConflict.Resolution.choices)
    manual_value = serializers.DecimalField(
        max_digits=4, decimal_places=2, min_value=0, max_value=20, required=False
    )

    def validate(self, attrs):
        if attrs["choice"] == GradeConflict.Resolution.MANUAL and "manual_value" not in attrs:
            raise serializers.ValidationError("manual_value est requis pour le choix 'manual_merge'.")
        return attrs
