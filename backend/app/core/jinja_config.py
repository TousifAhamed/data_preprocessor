from datetime import datetime
from jinja2 import Environment

def get_current_year():
    return datetime.now().year

def configure_templates(env: Environment):
    """Configure Jinja2 environment with custom functions"""
    env.globals.update({
        'get_year': get_current_year
    })
