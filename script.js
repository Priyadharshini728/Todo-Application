
// Get HTML elements
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const category = document.getElementById("category");
const dueDate = document.getElementById("dueDate");
const dueTime = document.getElementById("dueTime");
const priority = document.getElementById("priority");

const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const sortTasks = document.getElementById("sortTasks");

const totalCount = document.getElementById("totalCount");
const completedCount = document.getElementById("completedCount");
const pendingCount = document.getElementById("pendingCount");
const overdueCount = document.getElementById("overdueCount");

const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");

const submitBtn = document.getElementById("submitBtn");
const cancelEdit = document.getElementById("cancelEdit");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "All";
let editingId = null;

// Display current date
document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

// Save tasks in Local Storage
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Check overdue tasks
function isOverdue(task) {
    const taskDate = new Date(task.date + "T" + task.time);
    return !task.completed && taskDate < new Date();
}

// Add or update task
taskForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const taskName = taskInput.value.trim();

    if (taskName === "") {
        alert("Please enter a task name.");
        return;
    }

    if (editingId !== null) {
        const task = tasks.find(item => item.id === editingId);

        task.text = taskName;
        task.category = category.value;
        task.date = dueDate.value;
        task.time = dueTime.value;
        task.priority = priority.value;
        task.notified = false;

    } else {
        tasks.push({
            id: Date.now(),
            text: taskName,
            category: category.value,
            date: dueDate.value,
            time: dueTime.value,
            priority: priority.value,
            completed: false,
            notified: false
        });

        // Request notification permission
        if ("Notification" in window &&
            Notification.permission === "default") {
            Notification.requestPermission();
        }
    }

    saveTasks();
    resetForm();
    displayTasks();
});

// Reset form
function resetForm() {
    taskForm.reset();
    priority.value = "Medium";

    editingId = null;
    submitBtn.textContent = "Add Task";
    cancelEdit.hidden = true;
}

// Cancel editing
cancelEdit.addEventListener("click", resetForm);

// Edit task
function editTask(id) {
    const task = tasks.find(item => item.id === id);

    taskInput.value = task.text;
    category.value = task.category;
    dueDate.value = task.date;
    dueTime.value = task.time;
    priority.value = task.priority;

    editingId = id;
    submitBtn.textContent = "Update Task";
    cancelEdit.hidden = false;

    taskInput.focus();
}

// Delete task
function deleteTask(id) {
    if (confirm("Do you want to delete this task?")) {
        tasks = tasks.filter(task => task.id !== id);

        if (editingId === id) {
            resetForm();
        }

        saveTasks();
        displayTasks();
    }
}

// Mark task as completed
function completeTask(id) {
    const task = tasks.find(item => item.id === id);

    task.completed = !task.completed;

    saveTasks();
    displayTasks();
}

// Display tasks
function displayTasks() {
    taskList.innerHTML = "";

    const today = new Date();
    const todayString = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    const searchText = searchInput.value.toLowerCase();

    let filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.text.toLowerCase().includes(searchText) ||
            task.category.toLowerCase().includes(searchText);

        let matchesFilter = true;

        if (currentFilter === "Today") {
            matchesFilter = task.date === todayString;
        }

        if (currentFilter === "Upcoming") {
            matchesFilter = task.date > todayString &&
                !task.completed;
        }

        if (currentFilter === "Overdue") {
            matchesFilter = isOverdue(task);
        }

        if (currentFilter === "Active") {
            matchesFilter = !task.completed;
        }

        if (currentFilter === "Completed") {
            matchesFilter = task.completed;
        }

        return matchesSearch && matchesFilter;
    });

    // Sort tasks
    if (sortTasks.value === "date") {
        filteredTasks.sort((a, b) =>
            new Date(a.date + "T" + a.time) -
            new Date(b.date + "T" + b.time)
        );
    }

    if (sortTasks.value === "priority") {
        const order = { High: 1, Medium: 2, Low: 3 };

        filteredTasks.sort((a, b) =>
            order[a.priority] - order[b.priority]
        );
    }

    if (sortTasks.value === "name") {
        filteredTasks.sort((a, b) =>
            a.text.localeCompare(b.text)
        );
    }

    // Create task cards
    filteredTasks.forEach(task => {
        const li = document.createElement("li");
        li.className = "task";

        if (task.completed) {
            li.classList.add("completed");
        }

        // Checkbox
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-check";
        checkbox.checked = task.completed;

        checkbox.addEventListener("change", function() {
            completeTask(task.id);
        });

        // Task details
        const content = document.createElement("div");
        content.className = "task-content";

        const name = document.createElement("div");
        name.className = "task-name";
        name.textContent = task.text;

        const details = document.createElement("div");
        details.className = "task-details";

        const categoryChip = document.createElement("span");
        categoryChip.className = "chip";
        categoryChip.textContent = task.category;

        const priorityChip = document.createElement("span");
        priorityChip.className =
            "chip priority-" + task.priority;
        priorityChip.textContent =
            task.priority + " Priority";

        const dateChip = document.createElement("span");
        dateChip.className = "chip";
        dateChip.textContent =
            new Date(task.date + "T00:00:00")
                .toLocaleDateString("en-IN") +
            " | " + task.time;

        details.append(categoryChip, priorityChip, dateChip);

        if (isOverdue(task)) {
            const overdueChip = document.createElement("span");
            overdueChip.className = "chip overdue-chip";
            overdueChip.textContent = "Overdue";
            details.appendChild(overdueChip);
        }

        content.append(name, details);

        // Edit and delete buttons
        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.addEventListener("click", function() {
            editTask(task.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", function() {
            deleteTask(task.id);
        });

        actions.append(editButton, deleteButton);
        li.append(checkbox, content, actions);

        taskList.appendChild(li);
    });

    // Show message when no tasks are available
    document.getElementById("emptyMessage").hidden =
        filteredTasks.length > 0;

    updateSummary();
}

// Update task counts and progress
function updateSummary() {
    const completed = tasks.filter(task => task.completed).length;
    const pending = tasks.length - completed;
    const overdue = tasks.filter(isOverdue).length;

    totalCount.textContent = tasks.length;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
    overdueCount.textContent = overdue;

    let progress = 0;

    if (tasks.length > 0) {
        progress = Math.round(
            (completed / tasks.length) * 100
        );
    }

    progressBar.style.width = progress + "%";
    progressPercent.textContent = progress + "% Completed";
}

// Filter tasks
document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", function() {
        currentFilter = button.dataset.filter;

        document.querySelectorAll(".filter").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");
        displayTasks();
    });
});

// Search tasks
searchInput.addEventListener("input", displayTasks);

// Sort tasks
sortTasks.addEventListener("change", displayTasks);

// Clear completed tasks
document.getElementById("clearCompleted").addEventListener(
    "click", function() {

        const completed = tasks.filter(task => task.completed);

        if (completed.length === 0) {
            alert("No completed tasks to clear.");
            return;
        }

        if (confirm("Clear all completed tasks?")) {
            tasks = tasks.filter(task => !task.completed);

            saveTasks();
            displayTasks();
        }
    }
);

// Check for due task reminders
function checkReminders() {
    if (!("Notification" in window) ||
        Notification.permission !== "granted") {
        return;
    }

    tasks.forEach(task => {
        const taskDate = new Date(task.date + "T" + task.time);

        if (!task.completed && !task.notified &&
            taskDate <= new Date()) {

            new Notification("Task Reminder", {
                body: "Your task is due: " + task.text
            });

            task.notified = true;
            saveTasks();
        }
    });
}

// Check reminders every 30 seconds
setInterval(checkReminders, 30000);

// Display saved tasks when page opens
displayTasks();
checkReminders();
