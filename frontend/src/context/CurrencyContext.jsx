import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { supabase } from "../lib/supabase";


const BASE_CURRENCY = "NPR";

const currencies = {
    NPR: {
        code: "NPR",
        name: "Nepalese Rupee",
        symbol: "Rs.",
        locale: "en-IN",
    },

    USD: {
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        locale: "en-US",
    },

    GBP: {
        code: "GBP",
        name: "British Pound",
        symbol: "£",
        locale: "en-GB",
    },

    EUR: {
        code: "EUR",
        name: "Euro",
        symbol: "€",
        locale: "en-IE",
    },
};


const CurrencyContext =
    createContext(null);


export function CurrencyProvider({
    children,
}) {
    const [currency, setCurrencyState] =
        useState(BASE_CURRENCY);

    const [rates, setRates] = useState({
        NPR: 1,
    });

    const [ratesLoading, setRatesLoading] =
        useState(false);

    const [rateError, setRateError] =
        useState("");


    useEffect(() => {
        const loadCurrencyPreference =
            async () => {
                try {
                    const {
                        data: {
                            user,
                        },
                    } =
                        await supabase.auth.getUser();

                    const savedCurrency =
                        user?.user_metadata
                            ?.currency;

                    if (
                        savedCurrency &&
                        currencies[
                            savedCurrency
                        ]
                    ) {
                        setCurrencyState(
                            savedCurrency
                        );
                    }
                } catch (error) {
                    console.error(
                        "Unable to load currency preference:",
                        error
                    );
                }
            };

        loadCurrencyPreference();
    }, []);


    useEffect(() => {
        if (
            currency ===
            BASE_CURRENCY
        ) {
            setRates({
                NPR: 1,
            });

            setRateError("");

            return;
        }


        const loadRates = async () => {
            try {
                setRatesLoading(true);
                setRateError("");


                const response =
                    await fetch(
                        "https://api.frankfurter.dev/v2/rates?base=NPR&quotes=USD,GBP,EUR"
                    );


                if (!response.ok) {
                    throw new Error(
                        "Unable to fetch exchange rates."
                    );
                }


                const data =
                    await response.json();


                const nextRates = {
                    NPR: 1,
                };


                for (const row of data) {
                    if (
                        row?.quote &&
                        row?.rate
                    ) {
                        nextRates[
                            row.quote
                        ] = Number(
                            row.rate
                        );
                    }
                }


                if (
                    !nextRates[
                        currency
                    ]
                ) {
                    throw new Error(
                        `Exchange rate for ${currency} is unavailable.`
                    );
                }


                setRates(
                    nextRates
                );
            } catch (error) {
                console.error(
                    "Currency rate error:",
                    error
                );

                setRateError(
                    "Unable to update exchange rates."
                );
            } finally {
                setRatesLoading(
                    false
                );
            }
        };


        loadRates();
    }, [currency]);


    const setCurrency =
        async (nextCurrency) => {
            if (
                !currencies[
                    nextCurrency
                ]
            ) {
                return false;
            }


            setCurrencyState(
                nextCurrency
            );


            try {
                const {
                    error,
                } =
                    await supabase.auth.updateUser(
                        {
                            data: {
                                currency:
                                    nextCurrency,
                            },
                        }
                    );


                if (error) {
                    throw error;
                }


                return true;
            } catch (error) {
                console.error(
                    "Unable to save currency preference:",
                    error
                );

                return false;
            }
        };


    const convertFromBase = (
        amount
    ) => {
        const numericAmount =
            Number(amount || 0);


        if (
            currency ===
            BASE_CURRENCY
        ) {
            return numericAmount;
        }


        const rate =
            Number(
                rates[currency] ||
                    0
            );


        if (!rate) {
            return numericAmount;
        }


        return (
            numericAmount *
            rate
        );
    };


    const convertToBase = (
        amount
    ) => {
        const numericAmount =
            Number(amount || 0);


        if (
            currency ===
            BASE_CURRENCY
        ) {
            return numericAmount;
        }


        const rate =
            Number(
                rates[currency] ||
                    0
            );


        if (!rate) {
            return numericAmount;
        }


        return (
            numericAmount /
            rate
        );
    };


    const formatCurrency = (
        amount,
        options = {}
    ) => {
        const converted =
            convertFromBase(amount);

        const config =
            currencies[currency];


        return `${config.symbol} ${converted.toLocaleString(
            config.locale,
            {
                minimumFractionDigits:
                    options.minimumFractionDigits ??
                    2,

                maximumFractionDigits:
                    options.maximumFractionDigits ??
                    2,
            }
        )}`;
    };


    const formatCompactCurrency = (
        amount
    ) => {
        const converted =
            convertFromBase(amount);

        const absolute =
            Math.abs(converted);


        let value = converted;
        let suffix = "";


        if (
            absolute >=
            1000000
        ) {
            value =
                converted /
                1000000;

            suffix = "M";
        } else if (
            absolute >=
            1000
        ) {
            value =
                converted /
                1000;

            suffix = "K";
        }


        const config =
            currencies[currency];


        return `${config.symbol} ${value.toLocaleString(
            config.locale,
            {
                minimumFractionDigits:
                    suffix ? 1 : 2,

                maximumFractionDigits:
                    suffix ? 1 : 2,
            }
        )}${suffix}`;
    };


    const value = useMemo(
        () => ({
            currency,
            currencies,
            baseCurrency:
                BASE_CURRENCY,

            rates,
            ratesLoading,
            rateError,

            setCurrency,

            convertFromBase,
            convertToBase,

            formatCurrency,
            formatCompactCurrency,
        }),
        [
            currency,
            rates,
            ratesLoading,
            rateError,
        ]
    );


    return (
        <CurrencyContext.Provider
            value={value}
        >
            {children}
        </CurrencyContext.Provider>
    );
}


export function useCurrency() {
    const context =
        useContext(
            CurrencyContext
        );


    if (!context) {
        throw new Error(
            "useCurrency must be used inside CurrencyProvider."
        );
    }


    return context;
}