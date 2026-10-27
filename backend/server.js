
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Allow requests from your local website and parse JSON bodies
app.use(cors());
app.use(express.json());

// Temporary storage. Appointments will be lost when the server restarts.
const appointments = [];

// Health check
app.get("/", (req, res) => {
  res.send("Hospital Appointment Assistant backend is running!");
});

// Save an appointment in the temporary array
function saveAppointment({ patientName, department, appointmentDate, appointmentTime }) {
  const appointment = {
    id: appointments.length + 1,
    patientName,
    department,
    appointmentDate,
    appointmentTime,
    status: "pending"
  };

  appointments.push(appointment);
  return appointment;
}

// Website API: create an appointment
app.post("/api/appointments", (req, res) => {
  const { patientName, department, appointmentDate, appointmentTime } = req.body;

  if (!patientName || !department || !appointmentDate || !appointmentTime) {
    return res.status(400).json({
      message: "Please provide patientName, department, appointmentDate, and appointmentTime."
    });
  }

  const appointment = saveAppointment({
    patientName,
    department,
    appointmentDate,
    appointmentTime
  });

  res.status(201).json({
    message: "Appointment request received.",
    appointment
  });
});

// Website API: view saved appointment requests
app.get("/api/appointments", (req, res) => {
  res.json(appointments);
});

// Dialogflow ES webhook
app.post("/dialogflow-webhook", (req, res) => {
  try {
    const queryResult = req.body.queryResult || {};
    const parameters = { ...(queryResult.parameters || {}) };

    // Dialogflow may keep the booking details in session contexts.
    // Merge context parameters so the confirmation intent can access them.
    for (const context of queryResult.outputContexts || []) {
      Object.assign(parameters, context.parameters || {});
    }

    // Dialogflow @sys.person can return an object, e.g. { name: "..." }
    let patientName = parameters.patient_name;
    if (patientName && typeof patientName === "object") {
      patientName = patientName.name || patientName.displayName || "";
    }

    const department = parameters.department;
    const appointmentDate = parameters.appointment_date;
    const appointmentTime = parameters.appointment_time;

    if (!patientName || !department || !appointmentDate || !appointmentTime) {
      return res.json({
        fulfillmentText:
          "I could not find all your appointment details. Please start the booking again and provide your name, department, date, and time."
      });
    }

    const appointment = saveAppointment({
      patientName: String(patientName),
      department: String(department),
      appointmentDate: String(appointmentDate),
      appointmentTime: String(appointmentTime)
    });

    return res.json({
      fulfillmentText:
        `Your appointment request has been saved. ` +
        `Request ID: ${appointment.id}. ` +
        `Patient: ${appointment.patientName}. ` +
        `Department: ${appointment.department}. ` +
        `Date: ${appointment.appointmentDate}. ` +
        `Time: ${appointment.appointmentTime}. ` +
        `The request is pending hospital confirmation.`
    });
  } catch (error) {
    console.error("Dialogflow webhook error:", error);

    return res.json({
      fulfillmentText:
        "Sorry, I could not process your appointment request. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
