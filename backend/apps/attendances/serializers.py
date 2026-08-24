from rest_framework import serializers

from .models import Attendance, AttendanceConflict


class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.get_full_name", read_only=True)
    course_name = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "student", "course", "teacher", "student_name", "course_name",
            "attendance_date", "present", "reason_if_absent",
            "synced", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "synced", "created_at", "updated_at"]


class AttendanceItemSerializer(serializers.Serializer):
    """Une ligne d'appel, dans un batch."""
    student = serializers.IntegerField()
    # Accept three status options instead of a boolean
    status = serializers.ChoiceField(choices=[('present', 'Présent'), ('absent', 'Absent'), ('retard', 'Retard')])
    reason_if_absent = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    local_timestamp = serializers.DateTimeField()
    local_uuid = serializers.UUIDField(required=False)
    
    def to_internal_value(self, data):
        # Call parent to validate basic fields
        validated = super().to_internal_value(data)
        # Map status to the existing boolean fields expected by services
        status = validated.pop('status')
        if status == 'present':
            validated['present'] = True
        elif status == 'absent':
            validated['present'] = False
        else:  # retard
            validated['present'] = True
            validated['reason_if_absent'] = 'Retard'
        return validated


class AttendanceBatchSubmitSerializer(serializers.Serializer):
    """
    Payload attendu pour un appel complet :
    {
      "course": 3,
      "attendance_date": "2024-06-10",
      "offline": true,
      "items": [
        {"student": 12, "present": true, "local_timestamp": "..."},
        {"student": 13, "present": false, "reason_if_absent": "Maladie", "local_timestamp": "..."},
        ...
      ]
    }
    """
    course = serializers.UUIDField()
    attendance_date = serializers.DateField()
    offline = serializers.BooleanField(default=False)
    items = AttendanceItemSerializer(many=True, allow_empty=False)


class AttendanceConflictSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="attendance.student.user.get_full_name", read_only=True)
    course_name = serializers.CharField(source="attendance.course.name", read_only=True)

    class Meta:
        model = AttendanceConflict
        fields = [
            "id", "sync_entry", "attendance", "student_name", "course_name",
            "local_version", "remote_version",
            "resolution_choice", "resolved_present", "resolved_by", "resolved_at",
            "created_at",
        ]


class AttendanceConflictResolveSerializer(serializers.Serializer):
    choice = serializers.ChoiceField(choices=AttendanceConflict.Resolution.choices)
    manual_present = serializers.BooleanField(required=False)

    def validate(self, attrs):
        if attrs["choice"] == AttendanceConflict.Resolution.MANUAL and "manual_present" not in attrs:
            raise serializers.ValidationError("manual_present est requis pour le choix 'manual_merge'.")
        return attrs
