async function main() {
  const url = 'https://jjngoguweoiawuykwcwm.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqbmdvZ3V3ZW9pYXd1eWt3Y3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMDQ2NjMsImV4cCI6MjA5OTY4MDY2M30.xKHiOPR1pm8T7k5xXWqLHcCmqAsok0W7tQafI0oeovk';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}
main();
