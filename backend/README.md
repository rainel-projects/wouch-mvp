Create User

POST /users

curl -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"email\":\"test@wouch.app\",\"signup_source\":\"web\"}"


Response

{
  "user_id": "UUID",
  "email": "test@wouch.app",
  "signup_source": "web",
  "onboarding_status": "not_started",
  "current_part": "part_01",
  "current_question_order": 1,
  "created_at": "ISO_TIMESTAMP",
  "updated_at": "ISO_TIMESTAMP"
}

Submit Onboarding Answer

POST /onboarding

curl -X POST http://localhost:3000/onboarding -H "Content-Type: application/json" -d "{\"user_id\":\"USER_ID_HERE\",\"question_id\":\"RC_001\",\"question_part\":\"part_01\",\"selected_option_id\":\"opt_1\",\"selected_option_key\":\"A\",\"answer_value\":\"I prefer clear communication\",\"time_spent\":14}"


Response

{
  "message": "Onboarding answer saved",
  "answer": {
    "answer_id": "UUID",
    "answered_at": "ISO_TIMESTAMP"
  }
}

Get Current User (Stub)

GET /me

curl http://localhost:3000/me


Response

{
  "message": "Auth stub – user context not implemented yet"
}

Notes

These commands work in Windows PowerShell

Server must be running using:

npm run dev


Replace USER_ID_HERE with the user_id returned from /users

Endpoint Summary
Method	Endpoint	Status
POST	/users	Stub OK
POST	/onboarding	Stub OK
GET	/me	Stub OK