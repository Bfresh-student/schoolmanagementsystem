from django.db import models
from django.utils import timezone
from apps.users.models import User
from core.mixins import AuditableMixin, SyncableMixin, RatingMixin


class TeacherQualification(AuditableMixin):
    """Diplômes et qualifications d'un professeur"""
    
    QUALIFICATION_TYPE_CHOICES = [
        ('BACHELOR', 'Licence'),
        ('MASTER', 'Master'),
        ('DOCTORATE', 'Doctorat'),
        ('DIPLOMA', 'Diplôme'),
        ('CERTIFICATE', 'Certificat'),
        ('OTHER', 'Autre'),
    ]
    
    teacher = models.ForeignKey(
        'Teacher',
        on_delete=models.CASCADE,
        related_name='qualifications',
        verbose_name='Professeur'
    )
    qualification_type = models.CharField(
        max_length=50,
        choices=QUALIFICATION_TYPE_CHOICES,
        verbose_name='Type de qualification'
    )
    field_of_study = models.CharField(max_length=200, verbose_name='Domaine d\'études')
    institution = models.CharField(max_length=300, verbose_name='Institution')
    graduation_year = models.IntegerField(verbose_name='Année de graduation')
    certification_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Numéro de certification'
    )
    expiration_date = models.DateField(null=True, blank=True, verbose_name='Date d\'expiration')
    
    class Meta:
        db_table = 'teachers_qualification'
        verbose_name = 'Qualification'
        verbose_name_plural = 'Qualifications'
        ordering = ['-graduation_year']
    
    def __str__(self):
        return f"{self.teacher.full_name} - {self.get_qualification_type_display()} ({self.field_of_study})"
    
    @property
    def is_expired(self):
        if self.expiration_date:
            return timezone.now().date() > self.expiration_date
        return False


class TeacherSpecialty(AuditableMixin):
    """Spécialités d'enseignement d'un professeur"""
    
    teacher = models.ForeignKey(
        'Teacher',
        on_delete=models.CASCADE,
        related_name='specialties',
        verbose_name='Professeur'
    )
    subject = models.CharField(max_length=200, verbose_name='Matière/Sujet')
    level = models.CharField(
        max_length=50,
        choices=[
            ('KINDERGARTEN', 'Maternelle'),
            ('PRIMARY', 'Primaire'),
            ('SECONDARY', 'Secondaire'),
            ('ALL', 'Tous les niveaux'),
        ],
        verbose_name='Niveau d\'enseignement'
    )
    certification_level = models.CharField(
        max_length=20,
        choices=[
            ('BASIC', 'Basique'),
            ('INTERMEDIATE', 'Intermédiaire'),
            ('ADVANCED', 'Avancé'),
            ('EXPERT', 'Expert'),
        ],
        default='BASIC',
        verbose_name='Niveau de certification'
    )
    years_of_experience = models.PositiveIntegerField(default=0, verbose_name='Années d\'expérience')
    is_primary = models.BooleanField(default=False, verbose_name='Spécialité principale')
    
    class Meta:
        db_table = 'teachers_specialty'
        verbose_name = 'Spécialité'
        verbose_name_plural = 'Spécialités'
        unique_together = ('teacher', 'subject', 'level')
    
    def __str__(self):
        return f"{self.teacher.full_name} - {self.subject} ({self.level})"


class Teacher(AuditableMixin, SyncableMixin, RatingMixin):
    """Modèle Professeur lié à User"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    
    # Emploi
    teacher_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='ID Professeur'
    )
    employment_type = models.CharField(
        max_length=50,
        choices=[
            ('FULL_TIME', 'Temps plein'),
            ('PART_TIME', 'Temps partiel'),
            ('CONTRACT', 'Contrat'),
            ('TEMPORARY', 'Temporaire'),
        ],
        default='FULL_TIME',
        verbose_name='Type d\'emploi'
    )
    hire_date = models.DateField(default=timezone.now, verbose_name='Date d\'embauche')
    
    # Statut académique
    STATUS_CHOICES = [
        ('ACTIVE', 'Actif'),
        ('INACTIVE', 'Inactif'),
        ('ON_LEAVE', 'En congé'),
        ('RETIRED', 'Retraité'),
        ('TERMINATED', 'Renvoyé'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        verbose_name='Statut'
    )
    
    # Salaire et avantages
    salary_grade = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Échelon salarial'
    )
    monthly_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name='Salaire mensuel'
    )
    
    # Infos médicales
    health_insurance_number = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='Numéro d\'assurance maladie'
    )
    emergency_contact_name = models.CharField(max_length=200, blank=True, verbose_name='Contact d\'urgence')
    emergency_contact_phone = models.CharField(max_length=20, blank=True, verbose_name='Téléphone d\'urgence')
    
    # Métadonnées
    office_location = models.CharField(max_length=200, blank=True, verbose_name='Bureau/Salle')
    office_phone = models.CharField(max_length=20, blank=True, verbose_name='Téléphone bureau')
    bio = models.TextField(blank=True, verbose_name='Biographie')
    
    # Évaluation (hérité de RatingMixin)
    # rating: Note moyenne (0-5)
    # rating_count: Nombre d'avis
    
    class Meta:
        db_table = 'teachers_teacher'
        verbose_name = 'Professeur'
        verbose_name_plural = 'Professeurs'
        ordering = ['user__first_name', 'user__last_name']
        indexes = [
            models.Index(fields=['teacher_id']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} ({self.teacher_id})"
    
    @property
    def full_name(self):
        return self.user.get_full_name()
    
    @property
    def email(self):
        return self.user.email
    
    def get_primary_specialty(self):
        """Obtenir la spécialité principale"""
        return self.specialties.filter(is_primary=True).first() or self.specialties.first()
    
    def get_all_subjects(self):
        """Obtenir toutes les matières enseignées"""
        return self.specialties.values_list('subject', flat=True).distinct()


class TeacherSchedule(AuditableMixin):
    """Horaire de travail d'un professeur"""
    
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='schedules',
        verbose_name='Professeur'
    )
    
    DAY_CHOICES = [
        ('MONDAY', 'Lundi'),
        ('TUESDAY', 'Mardi'),
        ('WEDNESDAY', 'Mercredi'),
        ('THURSDAY', 'Jeudi'),
        ('FRIDAY', 'Vendredi'),
        ('SATURDAY', 'Samedi'),
    ]
    
    day_of_week = models.CharField(max_length=20, choices=DAY_CHOICES, verbose_name='Jour')
    start_time = models.TimeField(verbose_name='Heure de début')
    end_time = models.TimeField(verbose_name='Heure de fin')
    location = models.CharField(max_length=200, blank=True, verbose_name='Salle/Bureau')
    activity = models.CharField(
        max_length=200,
        choices=[
            ('TEACHING', 'Enseignement'),
            ('OFFICE_HOURS', 'Heures de bureau'),
            ('MEETING', 'Réunion'),
            ('SUPERVISION', 'Surveillance'),
            ('OTHER', 'Autre'),
        ],
        default='TEACHING',
        verbose_name='Type d\'activité'
    )
    is_active = models.BooleanField(default=True, verbose_name='Actif')
    
    class Meta:
        db_table = 'teachers_schedule'
        verbose_name = 'Horaire'
        verbose_name_plural = 'Horaires'
        unique_together = ('teacher', 'day_of_week', 'start_time', 'end_time')
        ordering = ['day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.teacher.full_name} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


class TeacherAttendance(AuditableMixin):
    """Présence/Absence des professeurs"""
    
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='attendances',
        verbose_name='Professeur'
    )
    date = models.DateField(default=timezone.now, verbose_name='Date')
    is_present = models.BooleanField(default=True, verbose_name='Présent')
    check_in_time = models.TimeField(null=True, blank=True, verbose_name='Heure d\'arrivée')
    check_out_time = models.TimeField(null=True, blank=True, verbose_name='Heure de départ')
    
    ABSENCE_TYPE_CHOICES = [
        ('SICK', 'Maladie'),
        ('PERSONAL', 'Raison personnelle'),
        ('UNPAID', 'Sans autorisation'),
        ('AUTHORIZED', 'Autorisé'),
        ('OTHER', 'Autre'),
    ]
    absence_type = models.CharField(
        max_length=50,
        choices=ABSENCE_TYPE_CHOICES,
        blank=True,
        verbose_name='Type d\'absence'
    )
    reason = models.TextField(blank=True, verbose_name='Raison')
    document_proof = models.FileField(
        upload_to='teacher_absence_proofs/%Y/%m/',
        null=True,
        blank=True,
        verbose_name='Justificatif'
    )
    
    class Meta:
        db_table = 'teachers_attendance'
        verbose_name = 'Présence'
        verbose_name_plural = 'Présences'
        unique_together = ('teacher', 'date')
        ordering = ['-date']
    
    def __str__(self):
        status = 'Présent' if self.is_present else 'Absent'
        return f"{self.teacher.full_name} - {self.date} ({status})"


class TeacherPerformanceReview(AuditableMixin):
    """Évaluation de performance d'un professeur"""
    
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='performance_reviews',
        verbose_name='Professeur'
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviewed_teachers',
        verbose_name='Évaluateur'
    )
    review_period = models.CharField(
        max_length=50,
        choices=[
            ('MONTHLY', 'Mensuel'),
            ('QUARTERLY', 'Trimestriel'),
            ('SEMI_ANNUAL', 'Semestriel'),
            ('ANNUAL', 'Annuel'),
        ],
        verbose_name='Période d\'évaluation'
    )
    review_date = models.DateField(default=timezone.localdate, verbose_name='Date d\'évaluation')
    
    # Critères d'évaluation (0-5)
    teaching_quality = models.IntegerField(default=3, verbose_name='Qualité d\'enseignement')
    student_engagement = models.IntegerField(default=3, verbose_name='Engagement des élèves')
    professionalism = models.IntegerField(default=3, verbose_name='Professionnalisme')
    communication = models.IntegerField(default=3, verbose_name='Communication')
    class_management = models.IntegerField(default=3, verbose_name='Gestion de classe')
    
    overall_rating = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        default=3.0,
        verbose_name='Note globale'
    )
    
    comments = models.TextField(blank=True, verbose_name='Commentaires')
    improvement_areas = models.TextField(blank=True, verbose_name='Domaines d\'amélioration')
    strengths = models.TextField(blank=True, verbose_name='Forces')
    
    class Meta:
        db_table = 'teachers_performance_review'
        verbose_name = 'Évaluation de performance'
        verbose_name_plural = 'Évaluations de performance'
        ordering = ['-review_date']
    
    def __str__(self):
        return f"{self.teacher.full_name} - {self.review_date}"
    
    def save(self, *args, **kwargs):
        # Calculer la note globale
        ratings = [
            self.teaching_quality,
            self.student_engagement,
            self.professionalism,
            self.communication,
            self.class_management,
        ]
        self.overall_rating = sum(ratings) / len(ratings)
        super().save(*args, **kwargs)


class TeacherLeaveRequest(AuditableMixin):
    """Demande de congé d'un professeur"""
    
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='leave_requests',
        verbose_name='Professeur'
    )
    
    LEAVE_TYPE_CHOICES = [
        ('ANNUAL', 'Congé annuel'),
        ('SICK', 'Arrêt maladie'),
        ('MATERNITY', 'Congé maternité'),
        ('PATERNITY', 'Congé paternité'),
        ('PERSONAL', 'Raison personnelle'),
        ('BEREAVEMENT', 'Deuil'),
        ('OTHER', 'Autre'),
    ]
    
    leave_type = models.CharField(
        max_length=50,
        choices=LEAVE_TYPE_CHOICES,
        verbose_name='Type de congé'
    )
    start_date = models.DateField(verbose_name='Date de début')
    end_date = models.DateField(verbose_name='Date de fin')
    reason = models.TextField(verbose_name='Raison')
    
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('APPROVED', 'Approuvé'),
        ('REJECTED', 'Rejeté'),
        ('CANCELLED', 'Annulé'),
    ]
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        verbose_name='Statut'
    )
    
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_teacher_leaves',
        verbose_name='Approuvé par'
    )
    approval_date = models.DateTimeField(null=True, blank=True, verbose_name='Date d\'approbation')
    rejection_reason = models.TextField(blank=True, verbose_name='Raison du rejet')
    
    class Meta:
        db_table = 'teachers_leave_request'
        verbose_name = 'Demande de congé'
        verbose_name_plural = 'Demandes de congé'
        ordering = ['-start_date']
    
    def __str__(self):
        return f"{self.teacher.full_name} - {self.get_leave_type_display()} ({self.start_date})"
    
    @property
    def duration_days(self):
        """Nombre de jours de congé"""
        return (self.end_date - self.start_date).days + 1


class TeacherCertification(AuditableMixin):
    """Certifications professionnelles d'un professeur"""
    
    teacher = models.ForeignKey(
        Teacher,
        on_delete=models.CASCADE,
        related_name='certifications',
        verbose_name='Professeur'
    )
    name = models.CharField(max_length=300, verbose_name='Nom de la certification')
    issuing_body = models.CharField(max_length=300, verbose_name='Organisme émetteur')
    issue_date = models.DateField(verbose_name='Date d\'obtention')
    expiration_date = models.DateField(null=True, blank=True, verbose_name='Date d\'expiration')
    credential_id = models.CharField(max_length=200, blank=True, verbose_name='ID d\'accréditation')
    credential_url = models.URLField(blank=True, verbose_name='URL de la accréditation')
    
    class Meta:
        db_table = 'teachers_certification'
        verbose_name = 'Certification'
        verbose_name_plural = 'Certifications'
        ordering = ['-issue_date']
    
    def __str__(self):
        return f"{self.teacher.full_name} - {self.name}"
    
    @property
    def is_expired(self):
        if self.expiration_date:
            return timezone.now().date() > self.expiration_date
        return False