const STORAGE_KEY = "berichtsbuddy.entries.v1";
const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

const state = {
  weekStart: getMonday(new Date()),
  selectedDate: null,
  entries: loadEntries(),
};

const dayListEl = document.getElementById("dayList");
const weekLabelEl = document.getElementById("weekLabel");
const entryDateLabelEl = document.getElementById("entryDateLabel");
const entryInputEl = document.getElementById("entryInput");
const entryPreviewEl = document.getElementById("entryPreview");

setupNavigation();
renderWeek();

entryInputEl.addEventListener("input", () => {
  if (!state.selectedDate) return;
  state.entries[state.selectedDate] = entryInputEl.value;
  saveEntries(state.entries);
  renderPreview(entryInputEl.value);
  markFilledDays();
});

function setupNavigation() {
  document.getElementById("prevWeek").addEventListener("click", () => {
    state.weekStart = addDays(state.weekStart, -7);
    renderWeek();
  });

  document.getElementById("nextWeek").addEventListener("click", () => {
    state.weekStart = addDays(state.weekStart, 7);
    renderWeek();
  });
}

function renderWeek() {
  const days = getWorkWeek(state.weekStart);
  const currentWeekHasToday = days.some(({ isoDate }) => isoDate === toISODate(new Date()));

  state.selectedDate =
    currentWeekHasToday ? toISODate(new Date()) : state.selectedDate && days.some((d) => d.isoDate === state.selectedDate)
      ? state.selectedDate
      : days[0].isoDate;

  dayListEl.innerHTML = "";

  days.forEach((day) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "day-item";
    button.dataset.date = day.isoDate;

    if (day.isoDate === state.selectedDate) button.classList.add("active");
    if (day.isoDate === toISODate(new Date())) button.classList.add("today");
    if ((state.entries[day.isoDate] || "").trim()) button.classList.add("has-content");

    button.innerHTML = `${day.weekday}<small>${day.displayDate}</small>`;
    button.addEventListener("click", () => {
      state.selectedDate = day.isoDate;
      document.querySelectorAll(".day-item").forEach((el) => el.classList.remove("active"));
      button.classList.add("active");
      renderSelectedDay();
    });

    dayListEl.appendChild(button);
  });

  weekLabelEl.textContent = buildWeekLabel(days[0].date, days[4].date);
  renderSelectedDay();
}

function renderSelectedDay() {
  const date = fromISODate(state.selectedDate);
  entryDateLabelEl.textContent = `${WEEKDAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]} • ${formatDate(date)}`;
  const text = state.entries[state.selectedDate] || "";
  entryInputEl.value = text;
  renderPreview(text);
}

function markFilledDays() {
  document.querySelectorAll(".day-item").forEach((item) => {
    const value = state.entries[item.dataset.date] || "";
    item.classList.toggle("has-content", value.trim().length > 0);
  });
}

function renderPreview(markdownText) {
  if (!markdownText.trim()) {
    entryPreviewEl.innerHTML = "<p><em>Noch kein Eintrag für diesen Tag.</em></p>";
    return;
  }

  entryPreviewEl.innerHTML = marked.parse(markdownText);
}

function buildWeekLabel(start, end) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function getWorkWeek(mondayDate) {
  return WEEKDAYS.map((weekday, index) => {
    const date = addDays(mondayDate, index);
    return {
      weekday,
      date,
      isoDate: toISODate(date),
      displayDate: formatDate(date),
    };
  });
}

function getMonday(date) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = local.getDay();
  const shift = day === 0 ? -6 : 1 - day;
  local.setDate(local.getDate() + shift);
  return local;
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function fromISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
