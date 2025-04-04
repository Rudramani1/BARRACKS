import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Award, Users, Play, PauseCircle, ChevronLeft, ChevronRight, Link, Copy, AlertCircle, Check } from "lucide-react";
import { getQuizSession, getLeaderboard } from "@/services/api";
import { supabase } from "@/integrations/supabase/client";
import { QuizQuestion, Participant } from "@/types/quizTypes";

const HostQuiz = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [quizSession, setQuizSession] = useState<{
    id: string;
    title: string;
    questions: QuizQuestion[];
    participants: Participant[];
  } | null>(null);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isShowingLeaderboard, setIsShowingLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<Participant[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      setIsLoading(true);
      try {
        const session = await getQuizSession(sessionId);
        if (session) {
          setQuizSession({
            id: session.id,
            title: session.title,
            questions: session.questions,
            participants: session.participants
          });
          setIsLoading(false);
        } else {
          setError("Quiz not found. The quiz session could not be found.");
          setIsLoading(false);
          toast({
            title: "Quiz not found",
            description: "The quiz session could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setError("Error loading quiz. There was a problem loading the quiz session.");
        setIsLoading(false);
        toast({
          title: "Error loading quiz",
          description: "There was a problem loading the quiz session.",
          variant: "destructive",
        });
      }
    };
    
    fetchSession();
  }, [sessionId, toast]);

  useEffect(() => {
    if (!sessionId) return;
    
    const channel = supabase
      .channel('public:participants')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'participants',
        filter: `quiz_id=eq.${sessionId}`
      }, () => {
        fetchLeaderboard();
      })
      .subscribe();
    
    fetchLeaderboard();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const fetchLeaderboard = async () => {
    if (!sessionId) return;
    
    try {
      const updatedLeaderboard = await getLeaderboard(sessionId);
      setLeaderboard(updatedLeaderboard);
      
      if (quizSession) {
        setQuizSession(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: updatedLeaderboard
          };
        });
      }
    } catch (error) {
      console.error("Error updating leaderboard:", error);
    }
  };

  const startQuiz = () => {
    setIsQuizActive(true);
    setCurrentQuestionIndex(0);
    setIsShowingLeaderboard(false);
    
    toast({
      title: "Quiz started",
      description: "Players can now start answering questions.",
    });
  };

  const pauseQuiz = () => {
    setIsQuizActive(false);
    
    toast({
      title: "Quiz paused",
      description: "The quiz has been paused.",
    });
  };

  const showNextQuestion = () => {
    if (quizSession && currentQuestionIndex < quizSession.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsShowingLeaderboard(true);
      setIsQuizActive(false);
      
      toast({
        title: "Quiz completed",
        description: "All questions have been answered. Showing final results.",
      });
    }
  };

  const showPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleCopyQuizLink = () => {
    const linkToCopy = `${window.location.origin}/join/${sessionId}`;
    navigator.clipboard.writeText(linkToCopy);
    setIsCopied(true);
    
    toast({
      title: "Link copied",
      description: "Quiz link copied to clipboard!",
    });
    
    setTimeout(() => setIsCopied(false), 2000);
  };

  const currentQuestion = quizSession?.questions[currentQuestionIndex];
  const progress = quizSession?.questions.length 
    ? ((currentQuestionIndex + 1) / quizSession.questions.length) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="text-center py-16">
          <Award className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Loading Quiz...</h2>
          <p className="text-muted-foreground mb-8">
            Please wait while we load your quiz session.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <Card className="max-w-md mx-auto p-6 border-destructive/20">
          <div className="text-center mb-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz Error</h2>
            <p className="text-muted-foreground">
              {error}
            </p>
          </div>
          
          <Button onClick={() => navigate("/quizzes")} className="w-full">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Quizzes
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {quizSession ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">{quizSession.title}</h1>
                
                <div className="flex items-center space-x-2">
                  {isQuizActive ? (
                    <Button variant="outline" size="sm" onClick={pauseQuiz}>
                      <PauseCircle className="h-4 w-4 mr-2" />
                      Pause Quiz
                    </Button>
                  ) : (
                    <Button size="sm" onClick={startQuiz}>
                      <Play className="h-4 w-4 mr-2" />
                      {currentQuestionIndex === 0 ? "Start Quiz" : "Resume Quiz"}
                    </Button>
                  )}
                </div>
              </div>
              
              <Progress value={progress} className="mb-8" />
              
              {isShowingLeaderboard ? (
                <div className="text-center py-8">
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-6">Final Results</h2>
                  
                  <div className="space-y-4 max-w-md mx-auto">
                    {leaderboard.map((player, index) => (
                      <div key={player.id} className="flex items-center justify-between bg-card border rounded-lg p-4">
                        <div className="flex items-center">
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 font-bold
                            ${index === 0 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' : 
                              index === 1 ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' : 
                              index === 2 ? 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100' : 'bg-muted text-muted-foreground'}`}
                          >
                            {index + 1}
                          </span>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <span className="text-lg font-bold">{player.score}</span>
                      </div>
                    ))}
                    
                    {leaderboard.length === 0 && (
                      <p className="text-muted-foreground">No participants have joined yet.</p>
                    )}
                  </div>
                  
                  <Button className="mt-8" onClick={() => navigate("/quizzes")}>
                    Create a New Quiz
                  </Button>
                </div>
              ) : currentQuestion ? (
                <div className="space-y-6">
                  <div className="bg-card border rounded-lg p-6 shadow-sm">
                    <div className="flex items-start mb-4">
                      <span className="bg-primary/10 text-primary font-medium rounded-full h-6 w-6 flex items-center justify-center mr-3 flex-shrink-0">
                        {currentQuestionIndex + 1}
                      </span>
                      <h3 className="text-xl font-medium">{currentQuestion.question}</h3>
                    </div>
                    
                    <div className="pl-9 space-y-3 mt-6">
                      {currentQuestion.options.map((option, index) => (
                        <div 
                          key={index} 
                          className={`border rounded-md p-4 
                            ${option === currentQuestion.correctAnswer ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30' : 'bg-card'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="bg-muted h-6 w-6 rounded-full flex items-center justify-center mr-3">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span>{option}</span>
                            </div>
                            
                            {option === currentQuestion.correctAnswer && (
                              <span className="text-xs font-medium text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40">
                                Correct
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={showPreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    
                    <Button onClick={showNextQuestion}>
                      {currentQuestionIndex === quizSession.questions.length - 1 ? 'Finish' : 'Next'}
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No questions available.</p>
                </div>
              )}
            </Card>
          </div>
          
          <div>
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Participants</h2>
                <span className="bg-primary/10 text-primary px-2 py-1 rounded text-sm font-medium">
                  {quizSession.participants.length} {quizSession.participants.length === 1 ? 'player' : 'players'}
                </span>
              </div>
              
              <div className="space-y-2 mb-6">
                <div className="bg-muted p-3 rounded-md flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Link className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Join Link:</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={handleCopyQuizLink}
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm mb-1">Quiz Code:</p>
                  <code className="bg-background px-2 py-1 rounded text-sm block overflow-hidden text-ellipsis select-all">
                    {quizSession.id}
                  </code>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-auto pr-2">
                {quizSession.participants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Waiting for participants to join...
                    </p>
                  </div>
                ) : (
                  quizSession.participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center justify-between bg-card border rounded-md p-3">
                      <div className="flex items-center">
                        <span className="bg-muted h-6 w-6 rounded-full flex items-center justify-center mr-2 text-xs">
                          {index + 1}
                        </span>
                        <span className="font-medium">{participant.name}</span>
                      </div>
                      <span className="font-bold">{participant.score}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleCopyQuizLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Join Link
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <Award className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Loading Quiz...</h2>
          <p className="text-muted-foreground mb-8">
            Please wait while we load your quiz session.
          </p>
        </div>
      )}
    </div>
  );
};

export default HostQuiz;
