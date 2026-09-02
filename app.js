const STORAGE_KEY = "berichtsbuddy.entries.v1";
const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

const state = {
  weekStart: getMonday(new Date()),
  selectedDate: null,
  entries: loadEntries(),
  isEditing: false,
};

const dayListEl = document.getElementById("dayList");
const weekLabelEl = document.getElementById("weekLabel");
const entryDateLabelEl = document.getElementById("entryDateLabel");
const entryInputEl = document.getElementById("entryInput");
const entryPreviewEl = document.getElementById("entryPreview");
const autosaveStatusEl = document.getElementById("autosaveStatus");
const exportRangeEl = document.getElementById("exportRange");
const exportButtonEl = document.getElementById("exportButton");
let autosaveStatusTimeoutId = null;

setupNavigation();
setupEditor();
setupExport();
renderWeek();

entryInputEl.addEventListener("input", () => {
  if (!state.selectedDate) return;
  setAutosaveStatus("Speichert…");
  state.entries[state.selectedDate] = entryInputEl.value;
  saveEntries(state.entries);
  scheduleSavedStatus();
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

function setupEditor() {
  entryInputEl.addEventListener("blur", () => {
    exitEditMode();
  });

  entryPreviewEl.addEventListener("click", () => {
    enterEditMode();
  });

  entryPreviewEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    enterEditMode();
  });
}

function setupExport() {
  exportButtonEl.addEventListener("click", () => {
    const range = exportRangeEl.value;
    const anchorDate = fromISODate(state.selectedDate || toISODate(new Date()));
    const exportData =
      range === "month"
        ? buildMonthExport(anchorDate)
        : buildWeekExport(state.weekStart);

    downloadMarkdown(exportData.filename, exportData.content);
    setAutosaveStatus("Export erfolgreich erstellt.");
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
  if (state.isEditing) {
    entryInputEl.classList.remove("is-hidden");
    entryPreviewEl.classList.add("is-hidden");
    return;
  }
  entryInputEl.classList.add("is-hidden");
  entryPreviewEl.classList.remove("is-hidden");
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

function enterEditMode() {
  if (!state.selectedDate) return;
  state.isEditing = true;
  entryInputEl.classList.remove("is-hidden");
  entryPreviewEl.classList.add("is-hidden");
  entryInputEl.focus();
  const caretPosition = entryInputEl.value.length;
  entryInputEl.setSelectionRange(caretPosition, caretPosition);
}

function exitEditMode() {
  state.isEditing = false;
  entryInputEl.classList.add("is-hidden");
  entryPreviewEl.classList.remove("is-hidden");
  renderPreview(entryInputEl.value);
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

function scheduleSavedStatus() {
  if (autosaveStatusTimeoutId) clearTimeout(autosaveStatusTimeoutId);
  autosaveStatusTimeoutId = setTimeout(() => {
    setAutosaveStatus("Automatisch gespeichert.");
  }, 800);
}

function setAutosaveStatus(message) {
  if (!autosaveStatusEl) return;
  autosaveStatusEl.textContent = message;
}

function buildWeekExport(weekStart) {
  const weekDays = getWorkWeek(weekStart);
  const content = [
    "# BerichtsBuddy Export",
    "",
    `## Zeitraum: Woche (${buildWeekLabel(weekDays[0].date, weekDays[4].date)})`,
    "",
    ...weekDays.flatMap((day) => {
      const value = (state.entries[day.isoDate] || "").trim();
      return [`### ${day.weekday}, ${day.displayDate}`, "", value || "_Kein Eintrag_", ""];
    }),
  ].join("\n");

  return {
    filename: `berichtsbuddy-woche-${weekDays[0].isoDate}.md`,
    content,
  };
}

function buildMonthExport(anchorDate) {
  const monthDays = getWorkMonth(anchorDate);
  const label = anchorDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const normalizedLabel = `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, "0")}`;
  const content = [
    "# BerichtsBuddy Export",
    "",
    `## Zeitraum: Monat (${label})`,
    "",
    ...monthDays.flatMap((day) => {
      const value = (state.entries[day.isoDate] || "").trim();
      return [`### ${day.weekday}, ${day.displayDate}`, "", value || "_Kein Eintrag_", ""];
    }),
  ].join("\n");

  return {
    filename: `berichtsbuddy-monat-${normalizedLabel}.md`,
    content,
  };
}

function getWorkMonth(anchorDate) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const days = [];
  const cursor = new Date(year, month, 1);

  while (cursor.getMonth() === month) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) {
      const isoDate = toISODate(cursor);
      days.push({
        weekday: WEEKDAYS[day - 1],
        displayDate: formatDate(cursor),
        isoDate,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
