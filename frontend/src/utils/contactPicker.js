export const getPhoneContacts = async () => {
  if (!("contacts" in navigator)) {
    return {
      supported: false,
      contacts: [],
    };
  }

  try {
    const contacts = await navigator.contacts.select(
      ["name", "tel"],
      {
        multiple: true,
      }
    );

    const phoneNumbers = contacts
      .flatMap((contact) => contact.tel || [])
      .map((phone) => String(phone).replace(/\D/g, ""))
      .filter(Boolean);

    return {
      supported: true,
      contacts,
      phoneNumbers,
    };
  } catch (error) {
    console.log("Contact picker cancelled/error:", error);

    return {
      supported: true,
      contacts: [],
      phoneNumbers: [],
    };
  }
};