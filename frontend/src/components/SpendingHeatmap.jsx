import { useMemo, useState } from "react";

import { buildSpendingHeatmap } from "../lib/insights";
import { useCurrency } from "../context/CurrencyContext";


const levelClasses = [
    "bg-neutral-100",
    "bg-red-100",
    "bg-red-300",
    "bg-red-500",
    "bg-red-700",
];


function SpendingHeatmap({
    transactions,
    weeks = 26,
    formatCurrency: formatCurrencyProp,
}) {
    const { formatCurrency: formatCurrencyFromContext } =
        useCurrency();

    const formatCurrency =
        formatCurrencyProp || formatCurrencyFromContext;

    const [selectedDay, setSelectedDay] =
        useState(null);


    const { weeks: weekColumns } = useMemo(
        () =>
            buildSpendingHeatmap(transactions, {
                weeks,
            }),
        [transactions, weeks]
    );


    const monthLabels = useMemo(() => {
        const labels = [];
        let lastMonth = null;

        weekColumns.forEach((week, index) => {
            const firstDay = week[0];

            if (!firstDay) {
                return;
            }

            const month =
                firstDay.dateObj.getMonth();

            if (month !== lastMonth) {
                labels.push({
                    index,
                    label: firstDay.dateObj.toLocaleDateString(
                        "en-US",
                        {
                            month: "short",
                        }
                    ),
                });

                lastMonth = month;
            }
        });

        return labels;
    }, [weekColumns]);


    const hasExpenses = (transactions || []).some(
        (t) => t.type === "expense"
    );


    if (!hasExpenses) {
        return (
            <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-neutral-200 px-6 text-center text-sm text-neutral-400">
                Add some expenses to see your spending activity here.
            </div>
        );
    }


    const cellSize = 12;


    return (
        <div>

            <div className="overflow-x-auto pb-1">

                <div
                    className="inline-flex flex-col gap-1"
                    style={{
                        minWidth:
                            weekColumns.length * cellSize,
                    }}
                >

                    <div
                        className="relative h-4 text-[10px] text-neutral-400"
                        style={{
                            width:
                                weekColumns.length * cellSize,
                        }}
                    >

                        {monthLabels.map(
                            ({ index, label }) => (
                                <span
                                    key={index}
                                    className="absolute"
                                    style={{
                                        left:
                                            index * cellSize,
                                    }}
                                >
                                    {label}
                                </span>
                            )
                        )}

                    </div>


                    <div className="flex gap-0.5">

                        {weekColumns.map(
                            (week, weekIndex) => (
                                <div
                                    key={weekIndex}
                                    className="flex flex-col gap-0.5"
                                >

                                    {week.map((day) => (
                                        <button
                                            type="button"
                                            key={day.date}
                                            onClick={() =>
                                                setSelectedDay(
                                                    day
                                                )
                                            }
                                            aria-label={`${day.date}: ${formatCurrency(
                                                day.total
                                            )}`}
                                            className={[
                                                "h-2.5 w-2.5 rounded-xs transition outline-none hover:ring-2 hover:ring-neutral-400 focus:ring-2 focus:ring-neutral-500",
                                                levelClasses[
                                                    day.level
                                                ],
                                                selectedDay?.date ===
                                                day.date
                                                    ? "ring-2 ring-neutral-900"
                                                    : "",
                                            ].join(" ")}
                                        />
                                    ))}

                                </div>
                            )
                        )}

                    </div>

                </div>

            </div>


            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">

                <span>Less</span>

                <div className="flex items-center gap-1">

                    {levelClasses.map((cls, index) => (
                        <span
                            key={index}
                            className={[
                                "h-2.5 w-2.5 rounded-xs",
                                cls,
                            ].join(" ")}
                        />
                    ))}

                </div>

                <span>More</span>

            </div>


            <div className="mt-4 min-h-13.5 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">

                {selectedDay ? (
                    selectedDay.total > 0 ? (
                        <>
                            <p className="text-sm font-medium text-neutral-800">
                                {new Date(
                                    `${selectedDay.date}T00:00:00`
                                ).toLocaleDateString(
                                    "en-US",
                                    {
                                        weekday: "long",
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    }
                                )}
                            </p>

                            <p className="mt-1 text-sm text-neutral-500">
                                {formatCurrency(
                                    selectedDay.total
                                )}{" "}
                                across {selectedDay.count}{" "}
                                {selectedDay.count === 1
                                    ? "transaction"
                                    : "transactions"}
                                {Object.keys(
                                    selectedDay.categories
                                ).length
                                    ? ` · mostly ${
                                          Object.entries(
                                              selectedDay.categories
                                          ).sort(
                                              (a, b) =>
                                                  b[1] - a[1]
                                          )[0][0]
                                      }`
                                    : ""}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-neutral-400">
                            No spending on{" "}
                            {new Date(
                                `${selectedDay.date}T00:00:00`
                            ).toLocaleDateString(
                                "en-US",
                                {
                                    month: "short",
                                    day: "numeric",
                                }
                            )}
                            .
                        </p>
                    )
                ) : (
                    <p className="text-sm text-neutral-400">
                        Tap a day to see what you spent.
                    </p>
                )}

            </div>

        </div>
    );
}


export default SpendingHeatmap;
