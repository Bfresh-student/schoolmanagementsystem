from rest_framework import serializers
from .models import Payment

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "student",
            "amount",
            "currency",
            "status",
            "payment_method",
            "transaction_id",
            "receipt_file",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at"]

    def create(self, validated_data):
        # Status defaults to PENDING; additional logic can be added later
        return Payment.objects.create(**validated_data) 
