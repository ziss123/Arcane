import { useState, useEffect } from "react";

export default function AddressBook() {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("arc-contacts");
    if (saved) setContacts(JSON.parse(saved));
  }, []);

  const saveContacts = (list) => {
    setContacts(list);
    localStorage.setItem("arc-contacts", JSON.stringify(list));
  };

  const addContact = () => {
    if (!name || !address) return;
    const updated = [...contacts, { name, address }];
    saveContacts(updated);
    setName("");
    setAddress("");
  };

  const removeContact = (index) => {
    const updated = contacts.filter((_, i) => i !== index);
    saveContacts(updated);
  };

  return (
    <div className="flex-1 p-6 flex flex-col gap-4 max-w-md">
      <h1 className="font-semibold text-lg">Address book</h1>
      <p className="text-xs text-gray-500">Saved locally on this device — never sent to the network.</p>

      <div className="bg-[#262626] rounded-md p-4 flex flex-col gap-2">
        <label className="text-xs text-gray-400">Label</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alice"
          className="border border-white/10 rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none focus:border-blue-500"
        />
        <label className="text-xs text-gray-400">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="border border-white/10 rounded-md px-3 py-2 text-sm bg-[#1f1f1f] outline-none focus:border-blue-500"
        />
        <button
          onClick={addContact}
          className="bg-blue-600 hover:bg-blue-500 transition rounded-md py-2 text-sm font-medium mt-1 flex items-center justify-center gap-2"
        >
          <i className="ti ti-plus"></i> Add contact
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {contacts.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-4">No saved addresses yet.</div>
        )}
        {contacts.map((c, i) => (
          <div
            key={i}
            className="bg-[#262626] rounded-md px-4 py-3 flex items-center justify-between"
          >
            <div>
              <div className="text-sm font-medium text-gray-100">{c.name}</div>
              <div className="text-xs text-gray-500">{c.address}</div>
            </div>
            <button
              onClick={() => removeContact(i)}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}