(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.TeacherWorkflow = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isResourceBound(data, code, subject) {
    const classroom = (data.classes || []).find((item) => item.code === code);
    const classWide = Boolean(classroom && classroom.res &&
      (subject === "國語文" || subject === "數學"));
    const groupBound = (data.resGroups || []).some((group) =>
      group.code === code && group.subj === subject);
    return classWide || groupBound;
  }

  function isResourceLockedSlot(data, schedule, overlays, code, day, period) {
    const key = `${code}|${day}|${period}`;
    const entry = schedule && schedule[key];
    if (entry && isResourceBound(data, code, entry.s)) return true;
    return (overlays || []).some((item) =>
      item.code === code && item.d === day && Number(item.p) === Number(period));
  }

  function fixedSignature(data, schedule, overlays, code, teacherBusy) {
    const classroom = (data.classes || []).find((item) => item.code === code) || {};
    const fixed = Object.entries(schedule || {})
      .filter(([key]) => key.split("|")[0] === code)
      .map(([key, value]) => [key, value.s || "", value.t || "", value.room || ""])
      .sort((a, b) => a[0].localeCompare(b[0]));
    const overlay = (overlays || [])
      .filter((item) => item.code === code)
      .map((item) => [item.grp || "", item.subj || "", item.t || "", item.d || "", Number(item.p) || 0])
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const relevantLimits = (data.limits || [])
      .filter((row) => row[0] === classroom.tutor || row[0] === code || row[0] === `${classroom.g}年級`)
      .map((row) => clone(row))
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const boundSubjects = Object.keys(data.subjects || {})
      .filter((subject) => isResourceBound(data, code, subject)).sort();
    return JSON.stringify({
      code,
      tutor: classroom.tutor || "",
      fixed,
      overlay,
      boundSubjects,
      locks: (data.locks || []).filter((item) => item.c === code)
        .map((item) => clone(item)).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      limits: relevantLimits,
      gradeSlots: clone((data.gslot || {})[classroom.g] || []),
      teacherBusy: [...(teacherBusy || [])].sort(),
    });
  }

  return { clone, isResourceBound, isResourceLockedSlot, fixedSignature };
}));
