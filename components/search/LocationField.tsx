type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function LocationField({ value, onChange }: Props) {
  return (
    <div className="flex-1">
      <label htmlFor="location" className="mb-1 block text-sm font-medium text-gray-700">
        Location (City or Postcode) *
      </label>
      <input
        type="text"
        id="location"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black focus:border-transparent focus:ring-2 focus:ring-primary"
        placeholder="Search a location… (e.g., London, UK or SW1A 1AA)"
      />
    </div>
  );
}

