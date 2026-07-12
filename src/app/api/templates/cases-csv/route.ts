import { NextResponse } from "next/server";

// CSV template for importing test cases (US-004).
// steps: separate steps with "|"; add an optional per-step expected with "::".
export async function GET() {
  const template = [
    "title,description,preconditions,steps,expected_result,priority,type,tags,estimate",
    '"Valid login with registered email","Ensure a user can log in","User is registered","Open /login :: Login form is shown|Enter a valid email and password :: Fields accept input|Click Log In :: Redirected to dashboard","User lands on the dashboard",HIGH,FUNCTIONAL,"smoke,login","1m 30s"',
    '"Login fails with wrong password","Validate error handling","User is registered","Open /login|Enter a valid email and wrong password|Click Log In","An error message is shown and no session is created",MEDIUM,FUNCTIONAL,"login,negative","90"',
  ].join("\n");

  return new NextResponse(template, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="testforge-template.csv"',
    },
  });
}
