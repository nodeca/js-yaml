import requests
import os
import time

base_url = 'https://redtest.ca/api/'

response = requests.post(f'{base_url}users/login/', data={
    'username': os.getenv('CYDERIAN_USERNAME'), 'password': os.getenv('CYDERIAN_PASSWORD')
})
access = response.json()['access']
headers = {'Authorization': f'Bearer {access}'}

response = requests.get(f'{base_url}users/self', headers=headers)
user_id = response.json()['id']

response = requests.post(f'{base_url}users/{user_id}/git/',
                         data={
                          'repo': os.getenv('REPO'),
                          'commit': os.getenv('GITHUB_SHA'),
                          'project': os.getenv('PROJECT_ID'),
                         }, headers=headers)

analysis_id = response.json()['analysis']

while True:
  response = requests.get(f'{base_url}users/{user_id}/analyses/{analysis_id}', headers=headers)
  data = response.json()
  if data['total_crashes'] > 0:
    response = requests.get(f'{base_url}analyses/{analysis_id}/crashes', headers=headers)
    for crash in response.json():
      print(crash['stackTrace'])
    print('Found crashes visit https://redtest.ca to download crashes.')
    exit(1)
  if data['status'] == 'T':
    exit(0)
  time.sleep(3)
