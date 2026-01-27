async function test() {
  const url =
    "https://daily-cloudcode-pa.googleapis.com/v1internal:generateContent";
  console.log(`Calling ${url}...`);
  try {
    const res = await fetch(url, { method: "POST", body: "{}" });
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
  } catch (e) {
    console.error(`Error: ${e.message}`);
  }
}
test();
