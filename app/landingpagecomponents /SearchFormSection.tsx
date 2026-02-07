
import SearchForm from "@/components/SearchForm"

export default function SearchFormSection() { 

    return (
        <>
        <div className="container h-[80vh] flex flex-col justify-center items-center gap-10">
            <h2 className="text-5xl font-semibold text-center text-gray-900">
                Turn a new leaf on a website
            </h2>
        <SearchForm/>
        </div>
        </>
    )
}