create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null check (char_length(customer_name) between 1 and 80),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  station_id text not null check (station_id in ('ps5','ps4-1','ps4-2')),
  booking_date date not null,
  start_time time not null,
  duration integer not null check (duration between 1 and 3),
  players integer not null check (players between 1 and 4),
  status text not null default 'confirmed' check (status in ('confirmed','cancelled')),
  created_at timestamptz not null default now(),
  check (booking_date >= current_date),
  check (start_time >= time '10:00' and start_time < time '22:00'),
  check (start_time = date_trunc('hour', start_time)::time),
  check (start_time + make_interval(hours => duration) <= time '22:00')
);
create index if not exists bookings_date_station_idx on public.bookings(booking_date, station_id, status);
alter table public.bookings enable row level security;
drop policy if exists "public can read confirmed booking slots" on public.bookings;
create policy "public can read confirmed booking slots" on public.bookings for select to anon using (status = 'confirmed');
revoke insert, update, delete, select on public.bookings from anon, authenticated;
-- Public clients can read only slot metadata, never customer names or phone numbers.
grant select (station_id, booking_date, start_time, duration, status)
  on public.bookings to anon, authenticated;

create or replace function public.create_booking(
  p_customer_name text, p_phone text, p_station_id text, p_booking_date date,
  p_start_time time, p_duration integer, p_players integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_end time;
begin
  if p_customer_name is null or char_length(trim(p_customer_name)) not between 1 and 80 then return jsonb_build_object('success',false,'message','Enter a valid name.'); end if;
  if p_phone is null or p_phone !~ '^[6-9][0-9]{9}$' then return jsonb_build_object('success',false,'message','Enter a valid 10-digit Indian mobile number.'); end if;
  if p_station_id not in ('ps5','ps4-1','ps4-2') then return jsonb_build_object('success',false,'message','Choose a valid station.'); end if;
  if p_booking_date < current_date then return jsonb_build_object('success',false,'message','Choose today or a future date.'); end if;
  if p_duration not between 1 and 3 or p_players not between 1 and 4 then return jsonb_build_object('success',false,'message','Choose a valid duration and player count.'); end if;
  if p_start_time < time '10:00' or p_start_time >= time '22:00' or p_start_time <> date_trunc('hour',p_start_time)::time then return jsonb_build_object('success',false,'message','Choose a valid start time between 10 AM and 10 PM.'); end if;
  v_end := p_start_time + make_interval(hours => p_duration);
  if v_end > time '22:00' then return jsonb_build_object('success',false,'message','That session would finish after closing time.'); end if;
  if p_booking_date = current_date and p_start_time <= localtime then return jsonb_build_object('success',false,'message','That start time has already passed.'); end if;
  perform pg_advisory_xact_lock(hashtext(p_station_id), hashtext(p_booking_date::text));
  if exists(select 1 from public.bookings b where b.station_id=p_station_id and b.booking_date=p_booking_date and b.status='confirmed' and p_start_time < b.start_time + make_interval(hours=>b.duration) and v_end > b.start_time) then
    return jsonb_build_object('success',false,'message','Sorry, that slot is already booked. Please choose another time.');
  end if;
  insert into public.bookings(customer_name,phone,station_id,booking_date,start_time,duration,players)
  values(trim(p_customer_name),p_phone,p_station_id,p_booking_date,p_start_time,p_duration,p_players) returning id into v_id;
  return jsonb_build_object('success',true,'booking_id',left(v_id::text,8));
end; $$;
revoke all on function public.create_booking(text,text,text,date,time,integer,integer) from public;
grant execute on function public.create_booking(text,text,text,date,time,integer,integer) to anon, authenticated;
