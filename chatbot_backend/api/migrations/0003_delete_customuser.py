# Generated by Django 5.1.7 on 2025-03-08 15:10

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_customuser_conversation_user'),
    ]

    operations = [
        migrations.DeleteModel(
            name='CustomUser',
        ),
    ]
