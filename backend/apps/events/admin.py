from django.contrib import admin

from .models import Event, EventMedia, EventParticipant


class EventParticipantInline(admin.TabularInline):
    model = EventParticipant
    extra = 0
    readonly_fields = ("registration_date",)


class EventMediaInline(admin.TabularInline):
    model = EventMedia
    extra = 0
    readonly_fields = ("uploaded_at",)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "event_type",
        "start_datetime",
        "status",
        "capacity_max",
        "confirmed_participants_count",
    )
    list_filter = ("event_type", "status", "is_online")
    search_fields = ("name", "location")
    inlines = [EventParticipantInline, EventMediaInline]
    readonly_fields = ("created_at", "updated_at")


@admin.register(EventParticipant)
class EventParticipantAdmin(admin.ModelAdmin):
    list_display = ("event", "user", "status", "registration_date", "synced")
    list_filter = ("status", "synced")
    search_fields = ("user__email", "event__name")
