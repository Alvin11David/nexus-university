from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="StudentRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("registration_number", models.CharField(max_length=64)),
                ("student_number", models.CharField(max_length=64)),
                ("email", models.EmailField(max_length=254)),
                ("full_name", models.CharField(max_length=255)),
                ("is_registered", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
        ),
        migrations.CreateModel(
            name="OtpVerification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("email", models.EmailField(max_length=254)),
                ("purpose", models.CharField(choices=[("signup", "Signup")], max_length=32)),
                ("otp_hash", models.CharField(max_length=64)),
                ("nonce", models.CharField(max_length=64)),
                ("verified", models.BooleanField(default=False)),
                ("attempts", models.PositiveSmallIntegerField(default=0)),
                ("max_attempts", models.PositiveSmallIntegerField(default=5)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField()),
                ("verified_at", models.DateTimeField(blank=True, null=True)),
                (
                    "student_record",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="otp_verifications",
                        to="api.studentrecord",
                    ),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="studentrecord",
            constraint=models.UniqueConstraint(
                fields=("registration_number", "student_number"),
                name="unique_student_record_identity",
            ),
        ),
    ]
