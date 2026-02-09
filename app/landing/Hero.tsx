import HeroTrybutton from "@/components/buttons/HeroTrybutton";
import { SeehowItWorksButton } from "@/components/buttons/HeroTrybutton";



export default function Hero() {
    return (
        <div className="text-center h-[80vh] grid grid-cols-2 justify-center items-center rounded-lg bg-linear-to-t from-primary/20 to-primary/40 m-5">
            <div className="flex flex-col justify-center items-center gap-4">
                <h1 className="text-7xl font-bold text-gray-900 mb-2">
                    Help websites turn over a fresh leaf.
                </h1>
                <p className="text-lg text-gray-600">
                    Scan local businesses, spot outdated or inaccessible websites, <br /> and give developers the tools to help improve them.
                </p>
                <div className="flex gap-4">
                    <HeroTrybutton />
                    <SeehowItWorksButton />
                </div>
            </div>
        </div>
    );
}