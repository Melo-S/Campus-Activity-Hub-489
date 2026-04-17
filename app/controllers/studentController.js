exports.renderHome = (req, res) => {
  const sampleFacilities = [
    { name: "Terrell Library", status: "Busy", updated: "5 min ago", badge: "Crowd" },
    { name: "UREC", status: "Moderate", updated: "12 min ago", badge: "Verified" },
    { name: "Southside Café", status: "Light", updated: "20 min ago", badge: "Crowd" },
  ];

  res.render("student/home", { facilities: sampleFacilities });
};