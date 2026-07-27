from django.contrib import admin

from .models import (
    Notification,
    NotificationChannel,
    NotificationPreference,
    NotificationQueueEntry,
    NotificationTemplate,
    NotificationTrigger,
)


class NotificationQueueEntryInline(admin.TabularInline):
    model = NotificationQueueEntry
    extra = 0
    readonly_fields = ("created_at",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "recipient",
        "trigger_type",
        "priority",
        "is_read",
        "created_at",
    )
    list_filter = ("priority", "is_read", "trigger_type")
    search_fields = ("title", "recipient__email")
    inlines = [NotificationQueueEntryInline]
    readonly_fields = ("created_at",)


@admin.register(NotificationChannel)
class NotificationChannelAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active")


@admin.register(NotificationTrigger)
class NotificationTriggerAdmin(admin.ModelAdmin):
    list_display = ("trigger_name", "template_key", "default_priority")
    search_fields = ("trigger_name",)


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ("template_key", "channel", "subject_line")
    list_filter = ("channel",)
    search_fields = ("template_key",)


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "trigger_type",
        "email_enabled",
        "sms_enabled",
        "push_enabled",
    )
    list_filter = ("email_enabled", "sms_enabled", "push_enabled")


@admin.register(NotificationQueueEntry)
class NotificationQueueEntryAdmin(admin.ModelAdmin):
    list_display = ("notification", "channel", "status", "retry_count", "synced")
    list_filter = ("status", "channel", "synced")
