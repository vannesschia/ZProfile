export async function POST(req) {
  const { termCode, subjectCode } = await req.json();

  const clientId = process.env.NEXT_PUBLIC_API_CLIENT_ID;
  const clientSecret = process.env.API_CLIENT_SECRET;
  const tokenURL = "https://gw.api.it.umich.edu/um/oauth2/token";
  const apiURL = `https://gw.api.it.umich.edu/um/Curriculum/SOC/Terms/${termCode}/Schools/LSA/Subjects/${subjectCode}/CatalogNbrs`;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch(tokenURL, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "umscheduleofclasses"
    })
  });

  if (!tokenRes.ok) {
    return new Response("Token fetch failed", { status: 401 });
  }

  const { access_token } = await tokenRes.json();

  const courseRes = await fetch(apiURL, {
    headers: {
      "Authorization": `Bearer ${access_token}`,
      "Accept": "application/json"
    }
  });

  if (!courseRes.ok) {
    const courseResError = await courseRes.text();
    return new Response(`Course fetch failed ${courseResError}`, { status: 400 });
  }

  const data = await courseRes.json();
  return Response.json(data.getSOCCtlgNbrsResponse.ClassOffered || []);
}