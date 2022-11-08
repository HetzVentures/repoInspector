# 
FROM python:3.9-slim

# 
WORKDIR /code

# 
COPY ./server/app/requirements.txt /code/requirements.txt

# 
RUN pip install -r /code/requirements.txt

# RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt
COPY ./server/app /code/app

# 
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "80"]