import { Octokit } from "@octokit/core";

export async function POST(req) {
  const { title, description } = await req.json();

  console.log("here")

  const octokit = new Octokit({
    auth: process.env.GITHUB_PAT
  })

  await octokit.request('POST /repos/vannesschia/ZProfile/issues', {
    owner: 'vannesschia',
    repo: 'ZProfile',
    title: 'test',
    body: 'test',
  })
}