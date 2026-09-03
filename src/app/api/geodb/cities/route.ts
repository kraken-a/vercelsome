import {NextResponse} from "next/server";

export async function GET(req: Request) {

    const {searchParams} = new URL(req.url);

    const country = searchParams.get("country");
    const city = searchParams.get("city")?.trim() ?? "";

    if (!country) {
        return NextResponse.json([]);
    }

    const url = new URL("https://wft-geo-db.p.rapidapi.com/v1/geo/cities");

    url.searchParams.set("limit", "10");

    // GeoDB filter by country
    url.searchParams.set("countryIds", country);

    // Only search by prefix when user typed something
    if (city.length > 0) {
        url.searchParams.set("namePrefix", city);
    }

    const response = await fetch(url.toString(), {
        headers: {
            "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
            "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
        },
    });

    const text = await response.text();

    console.log("STATUS:", response.status);
    console.log("REQUEST:", url.toString());
    console.log("COUNTRY:", country);
    console.log("CITY:", city);
    console.log("RAW RESPONSE:", text);

    try {
        const json = JSON.parse(text);

        return NextResponse.json(json.data ?? []);
    } catch (err) {
        console.error("Failed to parse GeoDB response:", err);
        return NextResponse.json([]);
    }
}