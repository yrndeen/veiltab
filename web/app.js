const $ = (id) => document.getElementById(id);

function setBanner(msg, kind = "") {
  const el = $("banner");
  el.textContent = msg;
  el.className = "banner" + (kind ? ` ${kind}` : "");
}

function renderState(data) {
  $("publicView").textContent = JSON.stringify(data.publicLedger, null, 2);
  $("privateView").textContent = JSON.stringify(data.privateLocal, null, 2);
}

async function api(path, body = null) {
  const res = await fetch(path, {
    method: body === null ? "GET" : "POST",
    headers: body === null ? undefined : { "Content-Type": "application/json" },
    body: body === null ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

async function refresh() {
  try {
    const data = await api("/api/state");
    renderState(data);
    const st = data.publicLedger.stateName;
    if (st === "Unopened") {
      setBanner("Empty state: No tab opened yet. Call openTab() to start.");
    } else {
      setBanner(`Contract state: ${st} (${data.publicLedger.commitmentCount}/${data.publicLedger.capacity} shares committed).`, "ok");
    }
  } catch (err) {
    setBanner(`Error: ${err.message}`, "err");
  }
}

$("openForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/api/open", {
      totalCents: Number($("totalInput").value),
      capacity: Number($("capInput").value),
    });
    renderState(data);
    setBanner(`Tab opened: public total ${data.publicLedger.tabTotal} cents, capacity ${data.publicLedger.capacity}.`, "ok");
  } catch (err) {
    setBanner(`openTab failed: ${err.message}`, "err");
  }
});

$("commitForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const slot = Number($("slotInput").value);
    const data = await api("/api/commit", {
      slot,
      shareCents: Number($("shareInput").value),
      saltSeed: $("saltInput").value,
    });
    renderState(data);
    setBanner(`Slot ${slot} committed salted hash to public ledger (share amount kept private).`, "ok");
  } catch (err) {
    setBanner(`commitShare failed: ${err.message}`, "err");
  }
});

$("sealBtn").addEventListener("click", async () => {
  try {
    const data = await api("/api/seal", {});
    renderState(data);
    setBanner("Balanced! sealAndProve() verified private shares sum exactly to public tabTotal.", "ok");
  } catch (err) {
    setBanner(`sealAndProve rejected: ${err.message}`, "err");
  }
});

$("discloseBtn").addEventListener("click", async () => {
  try {
    const slot = Number($("discloseSlotInput").value);
    const data = await api("/api/disclose", { slot });
    renderState(data);
    setBanner(`Selective disclosure: Slot ${slot} revealed ${data.publicLedger.disclosedAmount} cents; other shares remain hidden.`, "ok");
  } catch (err) {
    setBanner(`discloseMyShare failed: ${err.message}`, "err");
  }
});

$("resetBtn").addEventListener("click", async () => {
  try {
    const data = await api("/api/reset", {});
    renderState(data);
    setBanner("Tab reset to fresh Unopened Compact contract state.");
  } catch (err) {
    setBanner(`Reset failed: ${err.message}`, "err");
  }
});

void refresh();
