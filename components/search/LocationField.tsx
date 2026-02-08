type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function LocationField({ value, onChange }: Props) {
  return (
    <div className="flex-1">
      <label htmlFor="location" className="mb-1.5 block text-sm font-medium text-gray-700">
        Location
      </label>
      <input
        type="text"
        id="location"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="Enter a state, locality or area"
      />
    </div>
  );
}

