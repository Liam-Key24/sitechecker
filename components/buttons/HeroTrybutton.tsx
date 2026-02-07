import Link from "next/link";


export default function HeroTrybutton() {
    return (
        <div>
            <button className="bg-primary text-gray-900 px-4 py-2 rounded-md hover:brightness-95 transition">
                <Link href="/">Try Now</Link>
            </button>
        </div>
    );
}