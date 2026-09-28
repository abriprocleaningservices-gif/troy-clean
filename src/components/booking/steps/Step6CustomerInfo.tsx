import { useBooking } from "../BookingContext";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

export function Step6CustomerInfo() {
  const { state, updateCustomer, next, back } = useBooking();
  const c = state.customer;

  const canContinue = Boolean(
    c.firstName && c.lastName && c.email && c.phone && c.address && c.city && c.zip
  );

  return (
    <div>
      <h2 className="font-display text-2xl text-pine-950">Your information</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Input label="First name" required value={c.firstName} onChange={(e) => updateCustomer({ firstName: e.target.value })} />
        <Input label="Last name" required value={c.lastName} onChange={(e) => updateCustomer({ lastName: e.target.value })} />
        <Input label="Email" type="email" required value={c.email} onChange={(e) => updateCustomer({ email: e.target.value })} />
        <Input label="Phone" type="tel" required value={c.phone} onChange={(e) => updateCustomer({ phone: e.target.value })} />
        <div className="sm:col-span-2">
          <Input label="Address" required value={c.address} onChange={(e) => updateCustomer({ address: e.target.value })} />
        </div>
        <Input label="City" required value={c.city} onChange={(e) => updateCustomer({ city: e.target.value })} />
        <Input label="ZIP" required value={c.zip} onChange={(e) => updateCustomer({ zip: e.target.value })} />
        <div className="sm:col-span-2">
          <Textarea
            label="Access instructions"
            hint="Gate codes, lockbox, parking, pets to be aware of"
            value={c.accessInstructions ?? ""}
            onChange={(e) => updateCustomer({ accessInstructions: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Special instructions"
            value={c.specialInstructions ?? ""}
            onChange={(e) => updateCustomer({ specialInstructions: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="ghost" onClick={back}>Back</Button>
        <Button onClick={next} disabled={!canContinue}>Continue</Button>
      </div>
    </div>
  );
}
