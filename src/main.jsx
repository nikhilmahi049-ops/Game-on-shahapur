import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const url = import.meta.env.VITE_SUPABASE_URL || "";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const db = url && key ? createClient(url, key) : null;
const stations = [
  { id: "ps5", name: "PS5 Arena", price: 120, type: "PlayStation 5" },
  { id: "ps4-1", name: "PS4 Station 01", price: 80, type: "PlayStation 4" },
  { id: "ps4-2", name: "PS4 Station 02", price: 80, type: "PlayStation 4" }
];
const times = Array.from({ length: 12 }, (_, i) => `${String(i + 10).padStart(2, "0")}:00`);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const pretty = t => { const h = Number(t.slice(0,2)); return `${h % 12 || 12}:00 ${h >= 12 ? "PM" : "AM"}`; };

function App() {
  const [date, setDate] = useState(today());
  const [station, setStation] = useState("ps5");
  const [duration, setDuration] = useState("1");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [players, setPlayers] = useState("2");
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = stations.find(s => s.id === station);

  async function refresh() {
    if (!db) return;
    const { data, error } = await db.from("bookings").select("station_id,booking_date,start_time,duration,status").eq("booking_date", date).eq("status", "confirmed");
    if (error) setMessage("Could not load availability. Check the setup instructions.");
    else setBookings(data || []);
  }
  useEffect(() => { setTime(""); refresh(); }, [date]);
  useEffect(() => { setTime(""); }, [station, duration]);

  function taken(t) {
    const a = Number(t.slice(0,2)), b = a + Number(duration);
    return bookings.some(x => {
      if (x.station_id !== station) return false;
      const c = Number(String(x.start_time).slice(0,2)), d = c + Number(x.duration);
      return a < d && b > c;
    });
  }
  const choices = times.filter(t => Number(t.slice(0,2)) + Number(duration) <= 22);

  async function submit(e) {
    e.preventDefault(); setMessage("");
    if (!time) return setMessage("Choose an available start time.");
    if (!/^[6-9]\d{9}$/.test(phone)) return setMessage("Enter a valid 10-digit Indian mobile number.");
    if (!db) return setMessage("Booking database not connected yet. Follow SETUP.md before accepting real bookings.");
    setBusy(true);
    const { data, error } = await db.rpc("create_booking", {
      p_customer_name: name.trim(), p_phone: phone, p_station_id: station,
      p_booking_date: date, p_start_time: `${time}:00`,
      p_duration: Number(duration), p_players: Number(players)
    });
    setBusy(false);
    if (error || !data?.success) {
      setMessage(data?.message || "Could not confirm this slot. Refresh and try again.");
      await refresh(); return;
    }
    setMessage(`Booking confirmed! Reference: ${data.booking_id}. Please arrive 5 minutes early.`);
    setName(""); setPhone(""); setTime(""); await refresh();
  }

  return <div className="shell">
    <div className="ticker">◆ SHAHAPUR'S GAMING SPOT <span>PLAY • COMPETE • REPEAT</span></div>
    <header><a className="logo" href="#home"><b className="logo-icon">◈</b><span>GAME ON <em>SHAHAPUR</em><small>YOUR NEXT LEVEL STARTS HERE</small></span></a><nav><a href="#stations">Stations</a><a href="#booking">Book a slot</a><a className="nav-button" href="#booking">BOOK NOW ↗</a></nav></header>
    <main id="home">
      <section className="hero"><div className="hero-copy"><label>● &nbsp; THE GAME STARTS HERE</label><h1>READY.<br/><span>PLAYER ONE.</span></h1><p>Bring your squad. Pick your console.<br/>Make your next gaming memory.</p><a className="button" href="#booking">BOOK YOUR SESSION ↗</a><div className="stats"><div><b>03</b><small>GAMING STATIONS</small></div><i></i><div><b>PS5 + PS4</b><small>YOUR FAVOURITE CONSOLES</small></div><i></i><div><b>₹80<small>/HR</small></b><small>STARTING PRICE</small></div></div></div><div className="hero-art"><div className="ring"></div><div className="pad">⌘</div><div className="float-tag">LEVEL UP ⚡</div><div className="float-tag second">GAME ON / SHAHAPUR</div></div></section>
      <section className="section" id="stations"><div className="heading"><div><label>CHOOSE YOUR ARENA</label><h2>YOUR STATION.<br/><span>YOUR RULES.</span></h2></div><p>From next-gen action to multiplayer battles, find the setup that fits your game.</p></div><div className="cards">{stations.map((s,i)=><article className={`card c${i}`} key={s.id}><div className="card-top">0{i+1} / ARENA <b>●</b></div><div className="console"><div className={i===0?"tower":"slab"}></div><div className="pad-small">⌘</div></div><small className="console-type">{s.type}</small><h3>{s.name}</h3><p>{i===0?"Next-gen gaming":i===1?"Great for duos":"Challenge your squad"}</p><div className="price"><b>₹{s.price}</b><span>/ hour</span><button onClick={()=>{setStation(s.id);document.getElementById("booking").scrollIntoView({behavior:"smooth"});}}>SELECT ARENA ↗</button></div></article>)}</div></section>
      <section className="booking" id="booking"><div className="booking-layout"><div className="intro"><label>✦ &nbsp; LOCK IN YOUR SESSION</label><h2>YOUR NEXT<br/><span>WIN STARTS</span><br/>HERE.</h2><p>Choose a station, select a time, and get your gaming session on the calendar.</p><ul><li>✓ &nbsp; Choose your preferred console</li><li>✓ &nbsp; Check slot availability by date</li><li>✓ &nbsp; Shared schedule for bookings</li></ul><div className="starting">STARTING FROM<strong>₹80 <small>/ HOUR</small></strong></div></div>
      <form className="form" onSubmit={submit}><div className="form-head"><div><label>PLAYER BOOKING</label><h3>Reserve your spot</h3></div><b>◈</b></div><label className="field-title">SELECT YOUR STATION</label><div className="station-choices">{stations.map(s=><button type="button" key={s.id} className={station===s.id?"choice active":"choice"} onClick={()=>setStation(s.id)}><span>{s.id==="ps5"?"PS5":s.id==="ps4-1"?"PS4 · 01":"PS4 · 02"}</span><b>₹{s.price}<small>/hr</small></b></button>)}</div>
      <div className="row"><label>DATE<input type="date" min={today()} value={date} onChange={e=>setDate(e.target.value)} required/></label><label>DURATION<select value={duration} onChange={e=>setDuration(e.target.value)}><option value="1">1 hour</option><option value="2">2 hours</option><option value="3">3 hours</option></select></label></div>
      <div className="time-label"><label className="field-title">START TIME</label><span>◷ 10 AM – 10 PM</span></div><div className="times">{choices.map(t=><button type="button" key={t} disabled={taken(t)||(date===today()&&Number(t.slice(0,2))<=new Date().getHours())} className={`${time===t?"chosen":""} ${taken(t)?"taken":""}`} onClick={()=>setTime(t)}>{pretty(t)}{taken(t)&&<small>BOOKED</small>}</button>)}</div>
      <div className="row"><label>YOUR NAME<input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name" maxLength="80" required/></label><label>MOBILE NUMBER<input type="tel" inputMode="numeric" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,"").slice(0,10))} placeholder="10-digit number" required/></label></div>
      <label className="full-label">NUMBER OF PLAYERS<select value={players} onChange={e=>setPlayers(e.target.value)}><option value="1">1 player</option><option value="2">2 players</option><option value="3">3 players</option><option value="4">4 players</option></select></label>
      <div className="summary"><div><b>SESSION TOTAL</b><small>{selected.name} · {duration} hour{duration==="1"?"s":"s"}{time?` · ${pretty(time)}`:""}</small></div><strong>₹{selected.price*Number(duration)}</strong></div>
      {message&&<div className="message" role="status">{message}</div>}<button className="submit" disabled={busy}>{busy?"CONFIRMING…":"CONFIRM BOOKING"} <span>↗</span></button><p className="footnote">Please arrive 5 minutes before your slot. Contact the shop to change a confirmed booking.</p></form></div></section>
      <section className="end"><div><label>GOOD GAMES. GREAT COMPANY.</label><h2>BRING YOUR<br/><span>BEST PLAYER.</span></h2></div><div><p>Solo grind or squad night — the arena is waiting. Book your slot and let the match begin.</p><a className="button" href="#booking">FIND YOUR SLOT ↗</a></div><b className="watermark">GO!</b></section>
    </main><footer><a className="logo" href="#home"><b className="logo-icon">◈</b><span>GAME ON <em>SHAHAPUR</em><small>PLAY • COMPETE • REPEAT</small></span></a><span>PS5 | PS4 | MULTIPLAYER</span><small>© {new Date().getFullYear()} GAME ON SHAHAPUR</small></footer>
  </div>;
}
createRoot(document.getElementById("root")).render(<App />);

