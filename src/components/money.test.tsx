import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import { Money } from "@/components/money";
import messages from "../../messages/bn.json";

describe("Money", () => {
  it("renders a Bangla taka amount", () => {
    render(
      <NextIntlClientProvider locale="bn" messages={messages}>
        <Money value="2000.00" />
      </NextIntlClientProvider>,
    );
    expect(screen.getByText("৳২,০০০")).toBeInTheDocument();
  });
});
