import Link from "next/link";


export default function HeroTrybutton() {
    return (
        <div>
            <button className="bg-green-500 text-white px-4 py-2 rounded-md">
                <Link href="/">Try Now</Link>
            </button>
        </div>
    );
}