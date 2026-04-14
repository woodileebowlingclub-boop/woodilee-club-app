import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  "https://YOUR_PROJECT.supabase.co",
  "YOUR_ANON_KEY"
)

export default function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Woodilee Bowling Club</h1>
      <h2>Members Diary</h2>
      <p>Connected to Supabase ✔</p>
    </div>
  )
}