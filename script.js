// 要素を取得
const form  = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list  = document.getElementById("todo-list");

// 追加
 form.addEventListener("submit", (e) => {
   e.preventDefault();
   const text = input.value.trim();
   if (!text) return;
   
   const li = document.createElement("li");

   const checkbox = document.createElement("input");
   checkbox.type = "checkbox";

   const span = document.createElement("span");
   span.textContent = text;

   li.append(checkbox, span);
   list.prepend(li);

   input.value = "";
   input.focus();
});

// 完了トグル
list.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;
    const li = e.target.closest("li");
    li.classList.toggle("done", e.target.checked);
});
