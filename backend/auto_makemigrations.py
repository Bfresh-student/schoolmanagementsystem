import os
import django
import builtins
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

original_input = builtins.input

def auto_yes_input(prompt):
    print(prompt, "y")
    return "y"

builtins.input = auto_yes_input
try:
    call_command('makemigrations', 'hr')
finally:
    builtins.input = original_input
