import { Octokit } from "@octokit/core";

export async function POST(req) {
  const { title, description, name } = await req.json();

  const octokit = new Octokit({
    auth: process.env.GITHUB_PAT
  })

  try {
    await octokit.request('POST /repos/vannesschia/ZProfile/issues', {
      owner: 'vannesschia',
      repo: 'ZProfile',
      title: `${title}: ${name}`,
      body: description,
    })
    return new Response(`Successfully posted issue`, { status: 201 });
  } catch (error) {
    console.error("Failed to post issue:", error);
    return new Response(`Failed to post issue ${error}`, { status: 400 });
  }
}