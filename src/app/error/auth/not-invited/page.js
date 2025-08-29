"use client";

export default function ErrorPage({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 m-auto text-center p-8">
      <p className="text-3xl md:text-7xl font-bold">Something went wrong!</p>
      <p className="text-sm md:text-base text-center text-foreground">
        You are not listed as a member of this fraternity. <br/> If you think you this is a mistake, please reach out to our developers for help. Thank you!
      </p>
    </div>
  );
}