import fs from "fs";
import dayjs from "dayjs";
import { createEvents } from "ics";

export async function getMenu() {
    const url = "https://visma.thefoodplace.dk/banner/weekmenu/1";

    const res = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0"
        }
    });

    const html = await res.text();

    // Extract the __remixContext JSON
    const match = html.match(
        /window\.__remixContext\s*=\s*(\{[\s\S]*?\});/
    );

    if (!match) {
        throw new Error("Could not find remixContext in HTML");
    }

    const remixContext = JSON.parse(match[1]);

    console.log("remixContext");
    // console.log(remixContext);

    const menuItems =
        remixContext.routeData[
            "routes/banner/weekmenu/$location/index"
        ].data.data;

    return menuItems;
}



export async function generateCalendar() {
    const menu = await getMenu();

    const groupedMealsByDay = menu.reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) {
            acc[date] = [];
        }

        acc[date].push(item);
        return acc;
    }, {});


    const events = Object.entries(groupedMealsByDay).map(([date, meals]) => {
        const dateObject = dayjs(date, "DD.MM.YYYY");

        const mainMealName = meals.find(meal => meal.station_name.station_name === "World of Flavour").recipe_id.menu_info_1;
        const deliMealName = meals.find(meal => meal.station_name.station_name !== "The Deli").recipe_id.menu_info_1;
        const vegetarianMealName = meals.find(meal => meal.station_name.station_name !== "Go green").recipe_id.menu_info_1;

        const description = `
        Main: ${mainMealName}
        Deli: ${deliMealName}
        Vegetarian: ${vegetarianMealName}
        `;

        return {
            title: `🍽️ Lunch: ${mainMealName}`,
            description,
            location: "Cantine",
            start: [
                dateObject.year(),
                dateObject.month() + 1,
                dateObject.date(),
                12, 0
            ],
            duration: { hours: 1 }
        }
    })


    const { error, value } = createEvents(events);
    if (error) throw error;

    fs.mkdirSync("docs", { recursive: true });
    fs.writeFileSync("docs/cantine.ics", value);
}

generateCalendar();