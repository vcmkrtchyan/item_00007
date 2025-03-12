import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { AlertTriangle, ListChecks, Trophy, Trash, Star } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Competitor {
    id: string;
    name: string;
}

interface Score {
    competitorId: string;
    creativity: number;
    technique: number;
    presentation: number;
}

type CategoryKey = 'creativity' | 'technique' | 'presentation';

const categories: { name: string; key: CategoryKey }[] = [
    { name: 'Creativity', key: 'creativity' },
    { name: 'Technique', key: 'technique' },
    { name: 'Presentation', key: 'presentation' },
];

// StarRating component with hover effect, solid fill for selected stars, and cursor-pointer
interface StarRatingProps {
    value: number;
    onChange: (value: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ value, onChange }) => {
    const [hoverValue, setHoverValue] = useState(0);

    const handleClick = (starNumber: number) => {
        onChange(starNumber === value ? 0 : starNumber);
    };

    const handleMouseEnter = (starNumber: number) => {
        setHoverValue(starNumber);
    };

    const handleMouseLeave = () => {
        setHoverValue(0);
    };

    return (
        <div className="flex space-x-1">
            {Array.from({ length: 10 }, (_, i) => {
                const starNumber = i + 1;
                const isFilled = hoverValue ? starNumber <= hoverValue : starNumber <= value;
                const starColor = isFilled
                    ? hoverValue
                        ? 'text-yellow-400'
                        : 'text-yellow-500'
                    : 'text-gray-400';
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleClick(starNumber)}
                        onMouseEnter={() => handleMouseEnter(starNumber)}
                        onMouseLeave={handleMouseLeave}
                        className="cursor-pointer focus:outline-none"
                    >
                        <Star className={`w-6 h-6 ${starColor}`} fill={isFilled ? 'currentColor' : 'none'} />
                    </button>
                );
            })}
        </div>
    );
};

const MotionDialogContent = motion(DialogContent);

const App = () => {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [isAddCompetitorDialogOpen, setIsAddCompetitorDialogOpen] = useState(false);
    const [newCompetitorName, setNewCompetitorName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [currentCompetitorId, setCurrentCompetitorId] = useState('');
    const [currentScores, setCurrentScores] = useState({
        creativity: 0,
        technique: 0,
        presentation: 0,
    });

    // Load saved data on mount
    useEffect(() => {
        const storedCompetitors = localStorage.getItem('danceBattleCompetitors');
        const storedScores = localStorage.getItem('danceBattleScores');
        if (storedCompetitors) setCompetitors(JSON.parse(storedCompetitors));
        if (storedScores) setScores(JSON.parse(storedScores));
    }, []);

    // Save data when competitors or scores change
    useEffect(() => {
        localStorage.setItem('danceBattleCompetitors', JSON.stringify(competitors));
        localStorage.setItem('danceBattleScores', JSON.stringify(scores));
    }, [competitors, scores]);

    const handleAddCompetitor = useCallback(() => {
        if (!newCompetitorName.trim()) {
            setError('Competitor name cannot be empty.');
            return;
        }
        if (competitors.some((competitor) => competitor.name === newCompetitorName.trim())) {
            setError('Competitor name already exists.');
            return;
        }
        const newCompetitor: Competitor = {
            id: crypto.randomUUID(),
            name: newCompetitorName.trim(),
        };
        setCompetitors((prev) => [...prev, newCompetitor]);
        setNewCompetitorName('');
        setIsAddCompetitorDialogOpen(false);
        setError(null);
    }, [newCompetitorName, competitors]);

    // If deleting the only competitor, reset the star scores and selection
    const handleRemoveCompetitor = useCallback((competitorId: string) => {
        setCompetitors((prev) => {
            const updatedCompetitors = prev.filter((competitor) => competitor.id !== competitorId);
            if (updatedCompetitors.length === 0) {
                setCurrentScores({ creativity: 0, technique: 0, presentation: 0 });
                setCurrentCompetitorId('');
            }
            return updatedCompetitors;
        });
        setScores((prev) => prev.filter((score) => score.competitorId !== competitorId));
    }, []);

    const handleScoreChange = useCallback((category: string, value: number) => {
        setCurrentScores((prev) => ({ ...prev, [category]: value }));
    }, []);

    const handleSubmitScore = useCallback(() => {
        if (!currentCompetitorId) {
            setError('Please select a competitor.');
            return;
        }
        const newScore: Score = {
            competitorId: currentCompetitorId,
            creativity: currentScores.creativity,
            technique: currentScores.technique,
            presentation: currentScores.presentation,
        };
        setScores((prevScores) => {
            const existingIndex = prevScores.findIndex((score) => score.competitorId === newScore.competitorId);
            if (existingIndex > -1) {
                const updatedScores = [...prevScores];
                const existingScore = updatedScores[existingIndex];
                updatedScores[existingIndex] = {
                    competitorId: newScore.competitorId,
                    creativity: existingScore.creativity + newScore.creativity,
                    technique: existingScore.technique + newScore.technique,
                    presentation: existingScore.presentation + newScore.presentation,
                };
                return updatedScores;
            } else {
                return [...prevScores, newScore];
            }
        });
        setCurrentScores({ creativity: 0, technique: 0, presentation: 0 });
        setCurrentCompetitorId('');
        setError(null);
    }, [currentCompetitorId, currentScores]);

    const getCompetitorScores = useCallback(
        (competitorId: string) => scores.filter((score) => score.competitorId === competitorId),
        [scores]
    );

    const calculateTotalScore = useCallback(
        (competitorId: string) =>
            getCompetitorScores(competitorId).reduce(
                (total, score) => total + score.creativity + score.technique + score.presentation,
                0
            ),
        [getCompetitorScores]
    );

    const sortedCompetitors = React.useMemo(() => {
        return [...competitors].sort((a, b) => calculateTotalScore(b.id) - calculateTotalScore(a.id));
    }, [competitors, calculateTotalScore]);

    const dialogVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
    };

    const listItemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
        exit: { opacity: 0, y: -10, transition: { duration: 0.1 } },
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        Dance Battle Scoreboard
                    </h1>
                    <p className="text-gray-300 text-sm sm:text-base">
                        Real-time scoring and leaderboard for your dance battles.
                    </p>
                </div>

                {/* Competitors Section */}
                <div className="bg-gray-800/50 backdrop-blur-md rounded-xl px-4 py-4 sm:px-4 sm:py-6 shadow-lg border border-gray-700 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                            <ListChecks className="w-5 h-5" />
                            Competitors
                        </h2>
                        <Button
                            onClick={() => setIsAddCompetitorDialogOpen(true)}
                            className="cursor-pointer bg-[#2B7FFF] hover:bg-[#004BB6] text-white transition-colors duration-300"
                        >
                            Add Competitor
                        </Button>
                    </div>
                    {competitors.length > 0 ? (
                        <ul className="space-y-2">
                            {competitors.map((competitor) => (
                                <motion.li
                                    key={competitor.id}
                                    variants={listItemVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="flex items-center justify-between bg-gray-700/50 p-2 pr-4 rounded-md border border-gray-600"
                                >
                                    <span className="text-gray-200">{competitor.name}</span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveCompetitor(competitor.id)}
                                        className="cursor-pointer text-red-400 hover:text-red-300 ml-2"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </Button>
                                </motion.li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400">No competitors added yet.</p>
                    )}
                </div>

                {/* Score Input Form */}
                {competitors.length > 0 && (
                    <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-lg border border-gray-700 space-y-4">
                        <h2 className="text-xl font-semibold text-gray-200 flex items-center gap-2">
                            <ListChecks className="w-5 h-5" />
                            Score Input
                        </h2>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="competitor-select" className="text-gray-300">
                                    Competitor
                                </Label>
                                <Select
                                    onValueChange={(value) => setCurrentCompetitorId(value)}
                                    value={currentCompetitorId}
                                >
                                    <SelectTrigger className="cursor-pointer w-full bg-gray-700/50 text-gray-200 border-gray-600 rounded-md p-2 focus:ring-blue-500">
                                        <SelectValue placeholder="Select Competitor" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-gray-200">
                                        {competitors.map((competitor) => (
                                            <SelectItem
                                                key={competitor.id}
                                                value={competitor.id}
                                                className="cursor-pointer"
                                            >
                                                {competitor.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {categories.map((category) => (
                                <div key={category.key} className="space-y-2">
                                    <Label htmlFor={category.key} className="text-gray-300">
                                        {category.name}
                                    </Label>
                                    <StarRating
                                        value={currentScores[category.key]}
                                        onChange={(newValue) => handleScoreChange(category.key, newValue)}
                                    />
                                </div>
                            ))}
                            <Button
                                onClick={handleSubmitScore}
                                className="cursor-pointer bg-[#2B7FFF] hover:bg-[#004BB6] text-white transition-colors duration-300"
                            >
                                Submit Score
                            </Button>
                            {error && (
                                <div className="text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                {competitors.length > 0 && (
                    <div className="bg-gray-800/50 backdrop-blur-md rounded-xl p-4 sm:p-6 shadow-lg border border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Leaderboard
                        </h2>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-gray-300">Rank</TableHead>
                                        <TableHead className="text-gray-300">Competitor</TableHead>
                                        {categories.map((category) => (
                                            <TableHead key={category.key} className="text-gray-300">
                                                {category.name}
                                            </TableHead>
                                        ))}
                                        <TableHead className="text-gray-300">Total Score</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCompetitors.map((competitor, index) => {
                                        const competitorScores =
                                            getCompetitorScores(competitor.id)[0] || {
                                                creativity: 0,
                                                technique: 0,
                                                presentation: 0,
                                            };
                                        return (
                                            <TableRow key={competitor.id}>
                                                <TableCell className="font-medium text-gray-200">{index + 1}</TableCell>
                                                <TableCell className="font-medium text-gray-200">{competitor.name}</TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {competitorScores.creativity}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {competitorScores.technique}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {competitorScores.presentation}
                                                </TableCell>
                                                <TableCell className="font-medium text-gray-200">
                                                    {calculateTotalScore(competitor.id)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* Add Competitor Dialog */}
                <Dialog
                    open={isAddCompetitorDialogOpen}
                    onOpenChange={(open) => {
                        setIsAddCompetitorDialogOpen(open);
                        if (!open) {
                            setNewCompetitorName('');
                            setError(null);
                        }
                    }}
                >
                    <MotionDialogContent
                        variants={dialogVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="bg-gray-800/90 backdrop-blur-md border-gray-700 text-gray-200"
                    >
                        <DialogHeader>
                            <DialogTitle className="text-gray-200">Add New Competitor</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Enter the name of the competitor.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="competitor-name" className="text-gray-300">
                                    Competitor Name
                                </Label>
                                <Input
                                    id="competitor-name"
                                    value={newCompetitorName}
                                    onChange={(e) => setNewCompetitorName(e.target.value)}
                                    autoComplete="off"
                                    className="bg-gray-700/50 text-gray-200 border-gray-600 focus:ring-blue-500"
                                    placeholder="Competitor Name"
                                />
                            </div>
                            {error && (
                                <div className="text-red-400 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                onClick={() => setIsAddCompetitorDialogOpen(false)}
                                className="cursor-pointer bg-gray-700/50 text-gray-300 hover:bg-gray-700/70"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleAddCompetitor}
                                className="cursor-pointer bg-[#2B7FFF] hover:bg-[#004BB6] text-white transition-colors duration-300"
                            >
                                Add Competitor
                            </Button>
                        </DialogFooter>
                    </MotionDialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default App;
