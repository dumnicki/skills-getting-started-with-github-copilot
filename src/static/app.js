document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Failed to load activities: ${response.status}`);
      }
      const activities = await response.json();

      activitiesList.replaceChildren();
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("article");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const heading = document.createElement("h4");
        heading.textContent = name;

        const description = document.createElement("p");
        description.className = "activity-description";
        description.textContent = details.description;

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule:";
        schedule.append(scheduleLabel, ` ${details.schedule}`);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability:";
        availability.append(availabilityLabel, ` ${spotsLeft} spots left`);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";

        const participantCount = document.createElement("span");
        participantCount.className = "participant-count";
        participantCount.textContent = details.participants.length;
        participantsHeading.append(" ", participantCount);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        if (details.participants.length === 0) {
          const emptyMessage = document.createElement("li");
          emptyMessage.className = "empty-participants";
          emptyMessage.textContent = "No participants yet";
          participantsList.appendChild(emptyMessage);
        } else {
          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            listItem.className = "participant-item";

            const participantName = document.createElement("span");
            participantName.className = "participant-name";
            participantName.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.setAttribute("aria-label", `Unregister ${participant}`);
            removeButton.title = `Unregister ${participant}`;

            const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            icon.setAttribute("viewBox", "0 0 24 24");
            icon.setAttribute("aria-hidden", "true");
            icon.setAttribute("focusable", "false");

            const iconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            iconPath.setAttribute(
              "d",
              "M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3"
            );
            icon.appendChild(iconPath);
            removeButton.appendChild(icon);

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(participant)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Failed to unregister participant");
                }

                showMessage(result.message, "success");
                await fetchActivities();
              } catch (error) {
                showMessage(error.message || "Failed to unregister participant.", "error");
                console.error("Error unregistering participant:", error);
                removeButton.disabled = false;
              }
            });

            listItem.append(participantName, removeButton);
            participantsList.appendChild(listItem);
          });
        }

        participantsSection.append(participantsHeading, participantsList);
        activityCard.append(
          heading,
          description,
          schedule,
          availability,
          participantsSection
        );

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
