# This file content will be read and fixed
# Replacing: db = client["snow_removal_db"]
# With: db_name = os.getenv("DB_NAME", "snow_removal_db")
#       db = client[db_name]